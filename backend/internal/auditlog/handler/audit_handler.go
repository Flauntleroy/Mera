// Package handler provides audit log API for frontend.
package handler

import (
	"bufio"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"github.com/clinova/simrs/backend/pkg/response"
)

// AuditLogEntry represents an audit log entry.
type AuditLogEntry struct {
	ID          string                 `json:"id"`
	Timestamp   string                 `json:"ts"`
	Level       string                 `json:"level"`
	Module      string                 `json:"module"`
	Action      string                 `json:"action"`
	Entity      AuditEntity            `json:"entity"`
	SQLContext  map[string]interface{} `json:"sql_context,omitempty"`
	BusinessKey string                 `json:"business_key"`
	Actor       AuditActor             `json:"actor"`
	IP          string                 `json:"ip"`
	Summary     string                 `json:"summary"`
}

// AuditEntity represents the entity in audit log.
type AuditEntity struct {
	Table      string            `json:"table"`
	PrimaryKey map[string]string `json:"primary_key"`
}

// AuditActor represents the actor in audit log.
type AuditActor struct {
	UserID   string `json:"user_id"`
	Username string `json:"username"`
}

// AuditLogHandler handles audit log API requests.
type AuditLogHandler struct {
	logPath string
}

// NewAuditLogHandler creates a new audit log handler.
func NewAuditLogHandler(logPath string) *AuditLogHandler {
	return &AuditLogHandler{logPath: logPath}
}

// GetAuditLogs handles GET /admin/audit-logs
func (h *AuditLogHandler) GetAuditLogs(c *gin.Context) {
	// Parse query parameters
	fromStr := c.Query("from")
	toStr := c.Query("to")
	module := c.Query("module")
	user := c.Query("user")
	action := c.Query("action")
	businessKey := c.Query("business_key")
	pageStr := c.DefaultQuery("page", "1")
	limitStr := c.DefaultQuery("limit", "25")

	page, _ := strconv.Atoi(pageStr)
	limit, _ := strconv.Atoi(limitStr)
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 25
	}

	// Parse date range
	var fromDate, toDate time.Time
	var err error
	if fromStr != "" {
		fromDate, err = time.Parse("2006-01-02", fromStr)
		if err != nil {
			response.BadRequest(c, response.ErrCodeValidationError, "Format tanggal 'from' tidak valid")
			return
		}
	} else {
		fromDate = time.Now().AddDate(0, 0, -7) // Default last 7 days
	}
	if toStr != "" {
		toDate, err = time.Parse("2006-01-02", toStr)
		if err != nil {
			response.BadRequest(c, response.ErrCodeValidationError, "Format tanggal 'to' tidak valid")
			return
		}
	} else {
		toDate = time.Now()
	}

	// Collect all logs from date range
	var allLogs []AuditLogEntry
	for d := fromDate; !d.After(toDate); d = d.AddDate(0, 0, 1) {
		fileName := fmt.Sprintf("audit-%s.json", d.Format("2006-01-02"))
		filePath := filepath.Join(h.logPath, fileName)

		logs, err := h.readLogFile(filePath)
		if err != nil {
			continue // File might not exist
		}
		allLogs = append(allLogs, logs...)
	}

	// Filter logs
	var filteredLogs []AuditLogEntry
	for _, log := range allLogs {
		if module != "" && log.Module != module {
			continue
		}
		if user != "" && !strings.Contains(strings.ToLower(log.Actor.Username), strings.ToLower(user)) {
			continue
		}
		if action != "" && log.Action != action {
			continue
		}
		if businessKey != "" && !strings.Contains(strings.ToLower(log.BusinessKey), strings.ToLower(businessKey)) {
			continue
		}
		filteredLogs = append(filteredLogs, log)
	}

	// Sort by timestamp descending (newest first)
	sort.Slice(filteredLogs, func(i, j int) bool {
		return filteredLogs[i].Timestamp > filteredLogs[j].Timestamp
	})

	// Paginate
	total := len(filteredLogs)
	start := (page - 1) * limit
	end := start + limit
	if start > total {
		start = total
	}
	if end > total {
		end = total
	}

	pagedLogs := filteredLogs[start:end]

	// Add IDs for frontend
	for i := range pagedLogs {
		if pagedLogs[i].ID == "" {
			pagedLogs[i].ID = fmt.Sprintf("%d-%d", time.Now().Unix(), i)
		}
	}

	response.Success(c, gin.H{
		"logs":  pagedLogs,
		"total": total,
		"page":  page,
		"limit": limit,
	})
}

// GetAuditLogDetail handles GET /admin/audit-logs/:id
func (h *AuditLogHandler) GetAuditLogDetail(c *gin.Context) {
	id := c.Param("id")

	// Parse ID to get timestamp info
	parts := strings.Split(id, "-")
	if len(parts) < 2 {
		response.BadRequest(c, response.ErrCodeValidationError, "ID tidak valid")
		return
	}

	timestamp, err := strconv.ParseInt(parts[0], 10, 64)
	if err != nil {
		response.BadRequest(c, response.ErrCodeValidationError, "ID tidak valid")
		return
	}

	index, err := strconv.Atoi(parts[1])
	if err != nil {
		response.BadRequest(c, response.ErrCodeValidationError, "ID tidak valid")
		return
	}

	// Get date from timestamp
	date := time.Unix(timestamp, 0)
	fileName := fmt.Sprintf("audit-%s.json", date.Format("2006-01-02"))
	filePath := filepath.Join(h.logPath, fileName)

	logs, err := h.readLogFile(filePath)
	if err != nil {
		response.NotFound(c, "Audit log tidak ditemukan")
		return
	}

	if index < 0 || index >= len(logs) {
		response.NotFound(c, "Audit log tidak ditemukan")
		return
	}

	log := logs[index]
	log.ID = id

	response.Success(c, log)
}

// GetModules handles GET /admin/audit-logs/modules
func (h *AuditLogHandler) GetModules(c *gin.Context) {
	modules := []string{
		"auth",
		"usermanagement",
		"farmasi",
		"billing",
		"pasien",
		"inventory",
	}
	response.Success(c, modules)
}

func (h *AuditLogHandler) readLogFile(filePath string) ([]AuditLogEntry, error) {
	file, err := os.Open(filePath)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var logs []AuditLogEntry
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		if line == "" {
			continue
		}

		var log AuditLogEntry
		if err := json.Unmarshal([]byte(line), &log); err != nil {
			continue
		}
		logs = append(logs, log)
	}

	return logs, nil
}
