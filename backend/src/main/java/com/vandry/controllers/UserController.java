package com.vandry.controllers;

import com.vandry.dto.UpdateProfileRequest;
import com.vandry.entities.User;
import com.vandry.repositories.UserRepository;
import com.vandry.security.JwtService;
import com.vandry.services.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
@CrossOrigin(origins = "http://localhost:5173")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final UserService userService; // Inject UserService

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.substring(7);
            String email = jwtService.extractEmail(token);

            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new RuntimeException("Користувача не знайдено"));

            Map<String, Object> profileInfo = new HashMap<>();
            profileInfo.put("id", user.getId());
            profileInfo.put("email", user.getEmail());
            // Return actual username from database
            profileInfo.put("username", user.getUsername());
            profileInfo.put("role", user.getRole().name());

            return ResponseEntity.ok(profileInfo);

        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateProfile(@RequestHeader("Authorization") String authHeader,
                                           @RequestBody UpdateProfileRequest request) {
        try {
            String token = authHeader.substring(7);
            String email = jwtService.extractEmail(token);

            // Delegate logic to service layer
            userService.updateUserProfile(email, request);

            return ResponseEntity.ok(Map.of("message", "Профіль успішно оновлено"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}