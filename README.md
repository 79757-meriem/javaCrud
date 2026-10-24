# Daynote

A simple, responsive note-taking app built with Spring Boot. Create, edit, search, and delete notes from a clean browser-based interface. Notes are stored locally in an H2 database.

## Requirements

- Java 17 or later
- Maven (optional; the included Maven Wrapper can be used instead)

## Run the app

From the project root, run:

```bash
./mvnw spring-boot:run
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

To run the tests:

```bash
./mvnw test
```

## Notes API

The JSON API is available at `/api/notes`.

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/notes` | List notes, most recently updated first |
| `POST` | `/api/notes` | Create a note |
| `PUT` | `/api/notes/{id}` | Update a note |
| `DELETE` | `/api/notes/{id}` | Delete a note |

Create a note by sending a JSON object with a required title and optional content:

```bash
curl -X POST http://localhost:8080/api/notes \
  -H 'Content-Type: application/json' \
  -d '{"title":"A small idea","content":"Write it down before it slips away."}'
```

Titles are limited to 160 characters and content to 20,000 characters. The API returns `400 Bad Request` for invalid input and `404 Not Found` when updating or deleting a note that does not exist.

## Storage

The app uses a file-based H2 database at `./data/notes`. Data persists between restarts. The database directory is created relative to the working directory used to launch the app.
