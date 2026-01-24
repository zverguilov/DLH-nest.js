# Dirty Little Helper

## Authentication

### Register new user

- URL:

    POST api/v1/session/reg

- Description

    Get the active assessment of the currently logged user, if there is one. Only one active assessment at a time is allowed.

- Request

  - Method: POST
  - Body:
    - `user`: UserRegDTO, example:
    {
        "email": "<zdrako.verguilov@gmail.com>",
        "full_name": "Zdravko Verguilov",
        "password": "tralala"
    }

- Response

  - Body:

    {
        "id": "fd09d366-e0e3-433f-9ea6-e0450df0627d",
        "full_name": "Zdravko Verguilov"
    }

### Login

- URL:

    POST api/v1/session/login

- Description

    Login... duh...

- Request

  - Method: POST
  - Body:
    - `user`: UserLoginDTO, example:
    {
        "email": "<zdrako.verguilov@gmail.com>",
        "password": "tralala"
    }

- Response

  - Body:

    {
        "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjIyOWEzMjU1LTI4MGEtNDdlNi1hZjhiLTc3OTg1N2IzZmE2OCIsImVtYWlsIjoiemRyYXZrby52ZXJndWlsb3ZAZ21haWwuY29tIiwiaWF0IjoxNzEzMjY5NDczLCJleHAiOjE3MTM0ODU0NzN9.v8bW_7P_d2ij70uoC39NmQwvIWf9iOy3c-NKIis31Sc"
    }
