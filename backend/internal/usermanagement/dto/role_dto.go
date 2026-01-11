// Package dto contains data transfer objects for role management.
package dto

// CreateRoleRequest represents a request to create a role.
type CreateRoleRequest struct {
	Name        string `json:"name" binding:"required,min=2,max=50"`
	Description string `json:"description"`
}

// UpdateRoleRequest represents a request to update a role.
type UpdateRoleRequest struct {
	Name        string `json:"name" binding:"omitempty,min=2,max=50"`
	Description string `json:"description"`
}

// AssignRolePermissionsRequest represents a request to assign permissions to role.
type AssignRolePermissionsRequest struct {
	PermissionIDs []string `json:"permission_ids" binding:"required"`
}

// RoleResponse represents a role in response.
type RoleResponse struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Description string            `json:"description,omitempty"`
	IsSystem    bool              `json:"is_system"`
	Permissions []PermissionBrief `json:"permissions,omitempty"`
}

// PermissionBrief is a brief permission info.
type PermissionBrief struct {
	ID   string `json:"id"`
	Code string `json:"code"`
}

// RoleListResponse represents a list of roles.
type RoleListResponse struct {
	Roles []RoleResponse `json:"roles"`
}
