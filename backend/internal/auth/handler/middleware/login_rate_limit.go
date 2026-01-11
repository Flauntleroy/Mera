// Package middleware provides HTTP middleware including rate limiting.
package middleware

import (
	"bytes"
	"encoding/json"
	"io"
	"sync"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/clinova/simrs/backend/pkg/response"
)

// RateLimitStore defines the interface for rate limit storage.
// Can be implemented with in-memory map (development) or Redis (production).
type RateLimitStore interface {
	// Increment increments the counter for the given key and returns the new count.
	// If the key doesn't exist, it creates it with count 1.
	// Returns (count, error).
	Increment(key string) (int, error)
	// GetCount returns the current count for the given key.
	GetCount(key string) (int, error)
}

// LoginRateLimitConfig holds configuration for login rate limiting.
type LoginRateLimitConfig struct {
	MaxAttempts int           // Maximum login attempts allowed
	Window      time.Duration // Time window for rate limiting
}

// DefaultLoginRateLimitConfig returns default config: 10 attempts per 5 minutes.
func DefaultLoginRateLimitConfig() LoginRateLimitConfig {
	return LoginRateLimitConfig{
		MaxAttempts: 10,
		Window:      5 * time.Minute,
	}
}

// InMemoryRateLimitStore implements RateLimitStore using sync.Map.
// For development/testing. Replace with Redis for production.
type InMemoryRateLimitStore struct {
	mu      sync.RWMutex
	entries map[string]*rateLimitEntry
	window  time.Duration
}

type rateLimitEntry struct {
	count     int
	expiresAt time.Time
}

// NewInMemoryRateLimitStore creates a new in-memory rate limit store.
func NewInMemoryRateLimitStore(window time.Duration) *InMemoryRateLimitStore {
	store := &InMemoryRateLimitStore{
		entries: make(map[string]*rateLimitEntry),
		window:  window,
	}
	// Start cleanup goroutine
	go store.cleanup()
	return store
}

// Increment increments the counter for the given key.
func (s *InMemoryRateLimitStore) Increment(key string) (int, error) {
	s.mu.Lock()
	defer s.mu.Unlock()

	now := time.Now()
	entry, exists := s.entries[key]

	if !exists || now.After(entry.expiresAt) {
		// Create new entry or reset expired one
		s.entries[key] = &rateLimitEntry{
			count:     1,
			expiresAt: now.Add(s.window),
		}
		return 1, nil
	}

	// Increment existing entry
	entry.count++
	return entry.count, nil
}

// GetCount returns the current count for the given key.
func (s *InMemoryRateLimitStore) GetCount(key string) (int, error) {
	s.mu.RLock()
	defer s.mu.RUnlock()

	entry, exists := s.entries[key]
	if !exists || time.Now().After(entry.expiresAt) {
		return 0, nil
	}
	return entry.count, nil
}

// cleanup periodically removes expired entries to prevent memory leaks.
func (s *InMemoryRateLimitStore) cleanup() {
	ticker := time.NewTicker(1 * time.Minute)
	defer ticker.Stop()

	for range ticker.C {
		s.mu.Lock()
		now := time.Now()
		for key, entry := range s.entries {
			if now.After(entry.expiresAt) {
				delete(s.entries, key)
			}
		}
		s.mu.Unlock()
	}
}

// LoginRateLimiter provides rate limiting for login attempts.
type LoginRateLimiter struct {
	store  RateLimitStore
	config LoginRateLimitConfig
}

// NewLoginRateLimiter creates a new login rate limiter.
func NewLoginRateLimiter(store RateLimitStore, config LoginRateLimitConfig) *LoginRateLimiter {
	return &LoginRateLimiter{
		store:  store,
		config: config,
	}
}

// NewDefaultLoginRateLimiter creates a rate limiter with default config and in-memory store.
func NewDefaultLoginRateLimiter() *LoginRateLimiter {
	config := DefaultLoginRateLimitConfig()
	store := NewInMemoryRateLimitStore(config.Window)
	return NewLoginRateLimiter(store, config)
}

// loginRequestBody is used to peek at the username from request body.
type loginRequestBody struct {
	Username string `json:"username"`
}

// Middleware returns a Gin middleware that rate limits login attempts.
// Rate limit key format: "login:{username}:{ip}"
func (r *LoginRateLimiter) Middleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Read the body
		bodyBytes, err := io.ReadAll(c.Request.Body)
		if err != nil {
			// Let the handler deal with it
			c.Next()
			return
		}

		// Restore the body for the actual handler
		c.Request.Body = io.NopCloser(bytes.NewBuffer(bodyBytes))

		// Parse username from body
		var req loginRequestBody
		if err := json.Unmarshal(bodyBytes, &req); err != nil {
			// Invalid JSON - let the handler deal with validation
			c.Next()
			return
		}

		// Build rate limit key
		username := req.Username
		if username == "" {
			username = "_empty_"
		}
		ip := c.ClientIP()
		key := "login:" + username + ":" + ip

		// Check and increment rate limit
		count, err := r.store.Increment(key)
		if err != nil {
			// On error, allow the request (fail open)
			c.Next()
			return
		}

		// Check if limit exceeded
		if count > r.config.MaxAttempts {
			response.Error(c, 429, "RATE_LIMIT_EXCEEDED",
				"Terlalu banyak percobaan login. Silakan coba lagi nanti.")
			c.Abort()
			return
		}

		c.Next()
	}
}

// GetRemainingAttempts returns how many attempts are left for the given key.
func (r *LoginRateLimiter) GetRemainingAttempts(username, ip string) int {
	key := "login:" + username + ":" + ip
	count, _ := r.store.GetCount(key)
	remaining := r.config.MaxAttempts - count
	if remaining < 0 {
		return 0
	}
	return remaining
}
