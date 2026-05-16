package com.vandry.dto;

import lombok.Data;

@Data
public class UpdateProfileRequest {
    private String username;
    private String oldPassword;
    private String newPassword;
}