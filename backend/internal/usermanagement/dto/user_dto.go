// Package dto contains data transfer objects for user management.
package dto

import "time"

// CreateUserRequest represents a request to create a user.
type CreateUserRequest struct {
	Username string `json:"username" binding:"required,min=3,max=50"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password" binding:"required,min=8"`
	IsActive bool   `json:"is_active"`
}

// UpdateUserRequest represents a request to update a user.
type UpdateUserRequest struct {
	Username string `json:"username" binding:"omitempty,min=3,max=50"`
	Email    string `json:"email" binding:"omitempty,email"`
	IsActive *bool  `json:"is_active"`
}

// ResetPasswordRequest represents a request to reset password.
type ResetPasswordRequest struct {
	NewPassword string `json:"new_password" binding:"required,min=8"`
}

// AssignRolesRequest represents a request to assign roles to user.
type AssignRolesRequest struct {
	RoleIDs []string `json:"role_ids" binding:"required"`
}

// AssignPermissionsRequest represents permission override assignment.
type AssignPermissionsRequest struct {
	Overrides []PermissionOverrideDTO `json:"overrides" binding:"required"`
}

// PermissionOverrideDTO represents a permission override.
type PermissionOverrideDTO struct {
	PermissionID string `json:"permission_id" binding:"required"`
	Effect       string `json:"effect" binding:"required,oneof=grant revoke"`
}

// CopyAccessRequest represents a request to copy access from another user.
type CopyAccessRequest struct {
	SourceUserID string `json:"source_user_id" binding:"required"`
}

// UserResponse represents a user in response.
type UserResponse struct {
	ID          string      `json:"id"`
	Username    string      `json:"username"`
	Email       string      `json:"email"`
	IsActive    bool        `json:"is_active"`
	LastLoginAt *time.Time  `json:"last_login_at,omitempty"`
	CreatedAt   time.Time   `json:"created_at"`
	UpdatedAt   time.Time   `json:"updated_at"`
	Roles       []RoleBrief `json:"roles,omitempty"`
}

// RoleBrief is a brief role info.
type RoleBrief struct {
	ID   string `json:"id"`
	Name string `json:"name"`
}

// UserListResponse represents a paginated list of users.
type UserListResponse struct {
	Users []UserResponse `json:"users"`
	Total int            `json:"total"`
	Page  int            `json:"page"`
	Limit int            `json:"limit"`
}

// UserDetailResponse includes user with roles and permission overrides.
type UserDetailResponse struct {
	UserResponse
	PermissionOverrides []PermissionOverrideResponse `json:"permission_overrides,omitempty"`
}

// PermissionOverrideResponse represents a permission override in response.
type PermissionOverrideResponse struct {
	PermissionID   string `json:"permission_id"`
	PermissionCode string `json:"permission_code"`
	Effect         string `json:"effect"`
}
