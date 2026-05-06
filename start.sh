#!/bin/bash

echo "Installing backend dependencies..."
cd backend
npm install
cd ..

echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

echo "Installing python dependencies..."
cd python_backend
pip install -r requirements.txt
cd ..

echo "Starting backend..."
cd backend
npm run dev &
BACKEND_PID=$!

echo "Starting frontend..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "Starting python analytics engine..."
cd ../python_backend
uvicorn main:app --host 0.0.0.0 --port 8000 &
PYTHON_PID=$!

# Wait for any process to exit
wait -n
  
# Exit with status of process that exited first
exit $?
