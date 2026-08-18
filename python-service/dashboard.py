import streamlit as st
import pandas as pd
from sqlalchemy import create_engine
import os
from dotenv import load_dotenv

# Load env from parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

# Set page config
st.set_page_config(page_title="TOVEDROP God Mode", page_icon="🔮", layout="wide")

# Database connection
@st.cache_resource
def init_connection():
    db_url = os.environ.get("DATABASE_URL")
    if not db_url:
        st.error("DATABASE_URL environment variable is not set.")
        st.stop()
    
    # Replace postgresql:// with postgresql+psycopg2:// for SQLAlchemy
    if db_url.startswith("postgresql://"):
        db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
        
    engine = create_engine(db_url)
    return engine

engine = init_connection()

@st.cache_data(ttl=600)
def load_data(query):
    with engine.connect() as conn:
        return pd.read_sql(query, conn)

st.title("🔮 TOVEDROP God Mode Analytics")

# Basic layout
col1, col2, col3 = st.columns(3)

# 1. Total Users Query
try:
    users_df = load_data("SELECT role, COUNT(*) as count FROM \"User\" GROUP BY role;")
    riders = users_df[users_df['role'] == 'RIDER']['count'].sum() if not users_df.empty else 0
    drivers = users_df[users_df['role'] == 'DRIVER']['count'].sum() if not users_df.empty else 0
    
    col1.metric("Total Riders", int(riders))
    col2.metric("Total Drivers", int(drivers))
except Exception as e:
    st.error(f"Error loading user stats: {e}")

# 2. Total Revenue
try:
    rev_df = load_data("SELECT SUM(amount) as total FROM \"PlatformRevenue\";")
    total_rev = rev_df['total'].iloc[0] if not rev_df.empty and pd.notna(rev_df['total'].iloc[0]) else 0
    col3.metric("Platform Revenue", f"₦{total_rev:,.2f}")
except Exception as e:
    st.error(f"Error loading revenue: {e}")

st.divider()

# Charts
col_chart1, col_chart2 = st.columns(2)

with col_chart1:
    st.subheader("Trips Over Time")
    try:
        trips_df = load_data("""
            SELECT DATE("createdAt") as date, COUNT(*) as trips 
            FROM "Trip" 
            GROUP BY DATE("createdAt") 
            ORDER BY date;
        """)
        if not trips_df.empty:
            st.line_chart(trips_df.set_index('date'))
        else:
            st.info("No trips recorded yet.")
    except Exception as e:
        st.error(f"Error loading trips: {e}")

with col_chart2:
    st.subheader("Drop Transactions")
    try:
        drops_df = load_data("""
            SELECT type, SUM(amount) as total 
            FROM "DropTransaction" 
            GROUP BY type;
        """)
        if not drops_df.empty:
            st.bar_chart(drops_df.set_index('type'))
        else:
            st.info("No drops transactions yet.")
    except Exception as e:
        st.error(f"Error loading drops: {e}")
