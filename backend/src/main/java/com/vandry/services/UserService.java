package com.vandry.services;

import com.vandry.dto.AuthResponse;
import com.vandry.dto.RegisterRequest;
import com.vandry.entities.User;
import com.vandry.repositories.UserRepository;
import com.vandry.security.JwtService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserService(UserRepository userRepository, BCryptPasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

   public AuthResponse registerNewUser(RegisterRequest registerRequest) {
        if(userRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
            throw new RuntimeException("Користувач з такою поштою вже існує");
        }

        String passwordEncrypted = passwordEncoder.encode(registerRequest.getPassword());

        User user = new User();
        user.setEmail(registerRequest.getEmail());
        user.setUsername(registerRequest.getUsername());
        user.setPassword(passwordEncrypted);

        userRepository.save(user);

        String token = jwtService.generateToken(registerRequest.getEmail());
        return new AuthResponse(token);
   }

   public AuthResponse login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Користувача з такою поштою не знайдено"));

        if(!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Неправильний пароль");
        }

        String token = jwtService.generateToken(user.getEmail());
        return new AuthResponse(token);
   }

    public void updateUserProfile(String email, com.vandry.dto.UpdateProfileRequest request) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Користувача нпе знайдено"));

        if (request.getUsername() != null && !request.getUsername().trim().isEmpty()) {
            user.setUsername(request.getUsername().trim());
        }

        if (request.getNewPassword() != null && !request.getNewPassword().isEmpty()) {
            if (request.getOldPassword() == null || !passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
                throw new RuntimeException("Неправтльний поточний пароль");
            }
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        }

        userRepository.save(user);
    }
}
