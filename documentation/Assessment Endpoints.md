# Dirty Little Helper

## Assessment

### Get my active assessment

- URL:

    GET api/v1/assessment/ongoing/:userID

- Description

    Get the active assessment of the currently logged user, if there is one. Only one active assessment at a time is allowed.

- Request

  - Method: GET
  - Parameters:
    - `userID`: string, id of the currently logged user

- Response

  - Body:

    {
        "id": "eff58cd2-a3f0-4b6f-b0bb-d30806eddb02",
        "exam_type": "CSA",
        "time_started": "2024-04-16T10:42:14.000Z"
    }

### Get my assessments

- URL

    GET api/v1/assessment/list/:userID

- Description

    Get a list of currently logged user's past (submitted) assignments.

- Request

  - Method: GET
  - Parameters:
    - `userID`: string, id of the currently logged user

- Response

  - Body:

    [
        {
            "id": "11ecbfaa-ffb4-4538-a7e6-e4c456d9d7de",
            "exam_type": "CSA",
            "grade": null,
            "time_started": "2024-04-16T06:44:52.000Z",
            "time_ended": null,
            "status": "Draft",
            "submitted": 1,
            "pass": 0,
            "is_deleted": 0
        },
        {
            "id": "156b73c0-54fa-4583-9222-3b05e0d3c3b1",
            "exam_type": "HR",
            "grade": null,
        ...
        }
    ]

### Create Assignment

- URL:

    POST api/v1/assessment

- Description

    Generate a new assessment.

- Request

  - Method: POST
  - Body:
    - `payload`: CreateAssessmentDTO, example:
      {
        "id": "53a22e1d-a804-4ea7-9cd0-325505e0709c",
        "exam_type": "CSA",
        "time_started": "2024-04-16T12:45:38.000Z"
      }

- Response

  - Body:

    {
        "id": "eff58cd2-a3f0-4b6f-b0bb-d30806eddb02",
        "exam_type": "CSA",
        "time_started": "2024-04-16T10:42:14.000Z"
    }
