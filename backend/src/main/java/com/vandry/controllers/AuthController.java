package com.vandry.controllers;

import com.vandry.dto.AuthResponse;
import com.vandry.dto.LoginRequest;
import com.vandry.dto.RegisterRequest;
import com.vandry.entities.User;
import com.vandry.repositories.UserRepository;
import com.vandry.services.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "http://localhost:5173")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        System.out.println("Отримано запит на реєстрацію: " + request.getEmail());
        try {
            AuthResponse response = userService.registerNewUser(request);
            return ResponseEntity.ok(response);
        }
        catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        System.out.println("Отримано запит на вхід: " + request.getEmail());
        try {
            AuthResponse response = userService.login(request.getEmail(), request.getPassword());
            return ResponseEntity.ok(response);
        }
        catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(e.getMessage());
        }
    }
}
