package com.example.javacrud;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
public class NoteController {
    private final NoteRepository notes;

    public NoteController(NoteRepository notes) {
        this.notes = notes;
    }

    @GetMapping
    public List<Note> list() {
        return notes.findAllByOrderByUpdatedAtDesc();
    }

    @PostMapping
    public ResponseEntity<Note> create(@RequestBody NoteRequest request) {
        NoteRequest valid = validate(request);
        Note note = notes.save(new Note(valid.title(), valid.content()));
        return ResponseEntity.status(HttpStatus.CREATED).body(note);
    }

    @PutMapping("/{id}")
    public Note update(@PathVariable Long id, @RequestBody NoteRequest request) {
        NoteRequest valid = validate(request);
        Note note = notes.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Note not found"));
        note.update(valid.title(), valid.content());
        return notes.save(note);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!notes.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Note not found");
        }
        notes.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private NoteRequest validate(NoteRequest request) {
        if (request == null || request.title() == null || request.title().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Title is required");
        }
        String content = request.content() == null ? "" : request.content();
        if (request.title().trim().length() > 160 || content.length() > 20000) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Note is too long");
        }
        return new NoteRequest(request.title().trim(), content);
    }

    public record NoteRequest(String title, String content) {
    }
}
