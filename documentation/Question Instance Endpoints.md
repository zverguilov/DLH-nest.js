# Dirty Little Helper

## Question Instance

### Get question instance package

- URL:

    GET api/v1/assessment/:assessmentID/:questionNumber

- Description

    Retrieve a payload of a question instance, question and answer record data for an individual question page

- Request

  - Method: GET
  - Parameters:
    - `assessmentID`: string, id of the ongoing assessment
    - `questionNumber`: number, index of the current question instance

- Response

  - Body:

    {
        "id": "0d9eaa29-4037-41b7-b8c5-4eb5aa1d11dd",
        "__question__": {
            "id": "2d610966-fc4d-4029-81f0-f59a5ff0962c",
            "body": "Which one of the following statements is true when an Administrator edits a workflow?",
            "__answers__": [
                {
                    "id": "0d402d05-9ed8-420f-b3d2-9a9315ef9512",
                    "body": "When the workflow is checked out, other users with roles can make changes and add comments."
                },
                {
                    "id": "497f664c-3e7e-46cd-b163-e7d5b65d1d97",
                    "body": "Once an Administrator saves the changes to a workflow, the workflow is immediately accessible and the changes are available to all users with roles."
                },
                {
                    "id": "55eefe84-ec98-4049-9b17-d2e7d58bb130",
                    "body": "To prevent multiple users with roles from making changes to a workflow at the same time, workflows need to be checked out before they can be edited."
                },
                {
                    "id": "77ef2c2c-0b8a-46ff-a59c-6629870ed85a",
                    "body": "When a workflow is published, the workflow is available to the person who created it but not to other users with roles."
                }
            ]
        }
    }

### Mark an answer

- URL

    PUT api/v1/mark/:questionInstanceID

- Description

    Mark an answer - update the question instance selected_answers field

- Request

  - Method: PUT
  - Body:
    {
        "selectedAnswers":["ab2d1478-7310-44b8-ad4c-6e8c5be5b95e"],
        "questionID":"eaa4a8d5-9770-4f90-94c7-f898d4655eac"
    }

  - Parameters:
    - `instanceID`: string, id of the question instance

- Response: none
