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

   public User registerNewUser(RegisterRequest registerRequest) {
        if(userRepository.findByEmail(registerRequest.getEmail()).isPresent()) {
            throw new RuntimeException("user already exists");
        }

        User user = new User();
        user.setEmail(registerRequest.getEmail());
        user.setUsername(registerRequest.getUsername());

        String passwordEncrypted = passwordEncoder.encode(registerRequest.getPassword());
        user.setPassword(passwordEncrypted);

        return userRepository.save(user);
   }

   public AuthResponse login(String email, String password) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("user with this email not found"));

        if(passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("wrong password");
        }

        String token = jwtService.generateToken(user.getEmail());
        return new AuthResponse(token);
   }
}
