package com.vandry.dto;

import lombok.Data;

@Data
public class LoginRequest {
    String email;
    String password;
}
