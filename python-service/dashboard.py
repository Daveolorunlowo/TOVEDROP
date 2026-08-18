import streamlit as st
import pandas as pd
from sqlalchemy import create_engine
import os
import plotly.express as px
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load env from parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

st.set_page_config(page_title="TOVEDROP God Mode", page_icon="🔮", layout="wide")

# Database connection
@st.cache_resource
def init_connection():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        st.error("DATABASE_URL environment variable is not set.")
        st.stop()
    
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
        
    engine = create_engine(db_url)
    return engine

engine = init_connection()

@st.cache_data(ttl=300)
def load_data(query):
    with engine.connect() as conn:
        return pd.read_sql(query, conn)

# ----------------- SIDEBAR FILTERS -----------------
st.sidebar.title("Filters")
date_range = st.sidebar.radio(
    "Date Range",
    ["Last 7 Days", "Last 30 Days", "Last 90 Days", "All Time"],
    index=1
)

# Calculate date cutoff
now = datetime.now()
if date_range == "Last 7 Days":
    cutoff_date = now - timedelta(days=7)
elif date_range == "Last 30 Days":
    cutoff_date = now - timedelta(days=30)
elif date_range == "Last 90 Days":
    cutoff_date = now - timedelta(days=90)
else:
    cutoff_date = datetime(2020, 1, 1) # all time

date_filter = f"'{cutoff_date.strftime('%Y-%m-%d')}'"

st.title("🔮 TOVEDROP God Mode Analytics")

# ----------------- TOP METRICS -----------------
col1, col2, col3, col4 = st.columns(4)

# 1. Active Users
try:
    users_df = load_data(f"SELECT role, COUNT(*) as count FROM \"User\" WHERE \"createdAt\" >= {date_filter} GROUP BY role;")
    riders = users_df[users_df['role'] == 'RIDER']['count'].sum() if not users_df.empty else 0
    drivers = users_df[users_df['role'] == 'DRIVER']['count'].sum() if not users_df.empty else 0
    
    col1.metric("New Riders", int(riders))
    col2.metric("New Drivers", int(drivers))
except Exception as e:
    st.error(f"Error loading user stats: {e}")

# 2. Total Revenue & Drops
try:
    rev_df = load_data(f"SELECT SUM(amount) as total FROM \"PlatformRevenue\" WHERE \"createdAt\" >= {date_filter};")
    total_rev = rev_df['total'].iloc[0] if not rev_df.empty and pd.notna(rev_df['total'].iloc[0]) else 0
    col3.metric("Platform Revenue", f"₦{total_rev:,.2f}")
    
    drops_df = load_data(f"SELECT SUM(amount) as total FROM \"DropTransaction\" WHERE type='PURCHASE' AND \"createdAt\" >= {date_filter};")
    total_drops = drops_df['total'].iloc[0] if not drops_df.empty and pd.notna(drops_df['total'].iloc[0]) else 0
    col4.metric("Drops Sold", int(total_drops))
except Exception as e:
    st.error(f"Error loading revenue: {e}")

st.divider()

# ----------------- TABS -----------------
tab1, tab2, tab3 = st.tabs(["Overview & Revenue", "Driver Performance", "Ride Heatmap & Wait Times"])

with tab1:
    st.subheader("Revenue & Drops Over Time")
    col_rev, col_drop = st.columns(2)
    
    with col_rev:
        try:
            rev_time_df = load_data(f"""
                SELECT DATE("createdAt") as date, SUM(amount) as daily_revenue 
                FROM "PlatformRevenue" 
                WHERE "createdAt" >= {date_filter}
                GROUP BY DATE("createdAt") 
                ORDER BY date;
            """)
            if not rev_time_df.empty:
                rev_time_df['Cumulative'] = rev_time_df['daily_revenue'].cumsum()
                fig = px.area(rev_time_df, x="date", y=["daily_revenue", "Cumulative"], title="Platform Revenue Trend (Naira)", template="plotly_dark")
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("No revenue recorded in this period.")
        except Exception as e:
            st.error(e)
            
    with col_drop:
        try:
            drops_time_df = load_data(f"""
                SELECT DATE("createdAt") as date, type, COUNT(*) as count
                FROM "DropTransaction" 
                WHERE "createdAt" >= {date_filter}
                GROUP BY DATE("createdAt"), type
                ORDER BY date;
            """)
            if not drops_time_df.empty:
                fig = px.bar(drops_time_df, x="date", y="count", color="type", title="Drops Activity (Purchases vs Bookings)", template="plotly_dark")
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("No drops transactions yet.")
        except Exception as e:
            st.error(e)

with tab2:
    st.subheader("Driver Performance Leaderboard")
    try:
        driver_perf_df = load_data(f"""
            SELECT 
                u.name as "Driver Name",
                COUNT(t.id) as "Total Trips",
                SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END) as "Completed Trips",
                SUM(CASE WHEN t.status = 'CANCELLED' THEN 1 ELSE 0 END) as "Cancelled Trips"
            FROM "Trip" t
            JOIN "User" u ON t."driverId" = u.id
            WHERE t."createdAt" >= {date_filter}
            GROUP BY u.name
            ORDER BY "Completed Trips" DESC
            LIMIT 10;
        """)
        if not driver_perf_df.empty:
            driver_perf_df["Completion Rate (%)"] = (driver_perf_df["Completed Trips"] / driver_perf_df["Total Trips"] * 100).round(1)
            st.dataframe(driver_perf_df, use_container_width=True, hide_index=True)
        else:
            st.info("No driver trips recorded in this period.")
    except Exception as e:
        st.error(e)

with tab3:
    st.subheader("Ride Heatmap (Peak Hours) & Wait Times")
    col_heat, col_wait = st.columns(2)
    
    with col_heat:
        try:
            heat_df = load_data(f"""
                SELECT 
                    EXTRACT(DOW FROM "createdAt") as day_of_week,
                    EXTRACT(HOUR FROM "createdAt") as hour_of_day,
                    COUNT(*) as num_trips
                FROM "Trip"
                WHERE "createdAt" >= {date_filter}
                GROUP BY day_of_week, hour_of_day
            """)
            if not heat_df.empty:
                day_map = {0:'Sun', 1:'Mon', 2:'Tue', 3:'Wed', 4:'Thu', 5:'Fri', 6:'Sat'}
                heat_df['day'] = heat_df['day_of_week'].map(day_map)
                
                # Pivot to create a matrix for heatmap
                pivot_df = heat_df.pivot_table(values='num_trips', index='day', columns='hour_of_day', fill_value=0)
                
                # Reorder days
                days_order = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
                # Add missing days
                for d in days_order:
                    if d not in pivot_df.index:
                        pivot_df.loc[d] = 0
                pivot_df = pivot_df.reindex(days_order)
                
                fig = px.imshow(pivot_df, 
                                labels=dict(x="Hour of Day", y="Day of Week", color="Trips"),
                                x=pivot_df.columns,
                                y=pivot_df.index,
                                color_continuous_scale="Oranges",
                                title="Trips Heatmap by Day & Hour")
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("Not enough data for heatmap.")
        except Exception as e:
            st.error(e)
            
    with col_wait:
        try:
            wait_df = load_data(f"""
                SELECT 
                    EXTRACT(EPOCH FROM ("updatedAt" - "createdAt"))/60 as wait_minutes
                FROM "Trip"
                WHERE status IN ('CONFIRMED', 'COMPLETED') 
                  AND "driverId" IS NOT NULL
                  AND "createdAt" >= {date_filter}
            """)
            if not wait_df.empty:
                avg_wait = wait_df['wait_minutes'].mean()
                st.metric("Avg Driver Acceptance Time", f"{avg_wait:.1f} mins")
                
                fig = px.histogram(wait_df, x="wait_minutes", nbins=20, 
                                   title="Wait Time Distribution (Minutes)",
                                   color_discrete_sequence=["#D97706"],
                                   template="plotly_dark")
                st.plotly_chart(fig, use_container_width=True)
            else:
                st.info("No accepted trips in this period.")
        except Exception as e:
            st.error(e)
