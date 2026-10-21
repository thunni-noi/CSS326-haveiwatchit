@echo off
start cmd /k "cd backend && node --watch server.js"
start cmd /k "cd frontend && node run dev"