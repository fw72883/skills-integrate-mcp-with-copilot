# Mergington High School Activities API

A super simple FastAPI application that allows students to view and sign up for extracurricular activities.

## Features

- View all available extracurricular activities
- Sign up for and unregister students from activities as an authenticated staff member

## Getting Started

1. Install the dependencies:

   ```
   pip install -r requirements.txt
   ```

2. Configure the staff login in the environment. Do not commit credentials to the repository:

   ```
   export STAFF_USERNAME=teacher
   export STAFF_PASSWORD='choose-a-strong-password'
   ```

3. Run the application from the repository root:

   ```
   uvicorn app:app --app-dir src --reload
   ```

4. Open your browser and go to:
   - Activities website: http://localhost:8000
   - API documentation: http://localhost:8000/docs
   - Alternative documentation: http://localhost:8000/redoc

## API Endpoints

| Method | Endpoint                                                          | Description                                                         |
| ------ | ----------------------------------------------------------------- | ------------------------------------------------------------------- |
| GET    | `/activities`                                                     | Get all activities with their details and current participant count |
| GET    | `/staff/session`                                                   | Check whether the current browser is logged in as staff             |
| POST   | `/staff/login`                                                     | Log in with the configured staff username and password              |
| POST   | `/staff/logout`                                                    | Log out and revoke the current browser session                       |
| POST   | `/activities/{activity_name}/signup?email=student@mergington.edu` | Staff-only: sign up a student for an activity                        |
| DELETE | `/activities/{activity_name}/unregister?email=student@mergington.edu` | Staff-only: unregister a student from an activity                    |

The server keeps staff sessions in memory for up to eight hours and stores the
session token in an HttpOnly, SameSite cookie. Restarting the server invalidates
existing sessions. Use HTTPS when deploying the application; the session cookie
is marked Secure for HTTPS requests.

## Data Model

The application uses a simple data model with meaningful identifiers:

1. **Activities** - Uses activity name as identifier:

   - Description
   - Schedule
   - Maximum number of participants allowed
   - List of student emails who are signed up

2. **Students** - Uses email as identifier:
   - Name
   - Grade level

All data is stored in memory, which means data will be reset when the server restarts.
