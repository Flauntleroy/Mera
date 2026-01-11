// Package dto contains data transfer objects for permission management.
package dto

// CreatePermissionRequest represents a request to create a permission.
type CreatePermissionRequest struct {
	Code        string `json:"code" binding:"required"` // Format: domain.action
	Domain      string `json:"domain" binding:"required"`
	Action      string `json:"action" binding:"required"`
	Description string `json:"description"`
}

// PermissionResponse represents a permission in response.
type PermissionResponse struct {
	ID          string `json:"id"`
	Code        string `json:"code"`
	Domain      string `json:"domain"`
	Action      string `json:"action"`
	Description string `json:"description,omitempty"`
}

// PermissionListResponse represents a list of permissions.
type PermissionListResponse struct {
	Permissions []PermissionResponse `json:"permissions"`
}

// PermissionsByDomainResponse groups permissions by domain.
type PermissionsByDomainResponse struct {
	Domain      string               `json:"domain"`
	Permissions []PermissionResponse `json:"permissions"`
}
