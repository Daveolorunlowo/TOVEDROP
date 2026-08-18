@echo off
echo Starting TOVEDROP Python Microservices...
call venv\Scripts\activate
start cmd /k "title TOVEDROP KYC API && uvicorn main:app --port 8000 --reload"
start cmd /k "title TOVEDROP Analytics && streamlit run dashboard.py"
echo Services started in new windows.
