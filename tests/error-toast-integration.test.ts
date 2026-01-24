/**
 * Error Toast Integration Tests
 * Tests the integration between error handlers and toast notifications
 * 
 * Integration Testing for Error Toast Notifications
 * Tests error toast display, deduplication, queue management, and error categorization
 */
import { describe, test, expect, beforeEach, mock } from "bun:test";

import {
  handleGenerationError,
  getErrorToastType,
} from "@/lib/session-helpers";
import {
  ValidationError,
  OllamaTimeoutError,
  OllamaUnavailableError,
  OllamaModelMissingError,
  AIGenerationError,
  StorageError,
  InvariantError,
} from "@shared/errors";

import type { ChatMessage } from "@/lib/chat-utils";
import type { Logger } from "@/lib/logger";

describe("Error Toast Integration", () => {
  describe("Task 4.2: Error Toast Display", () => {
    let setChatMessages: ReturnType<typeof mock>;
    let showToast: ReturnType<typeof mock>;
    let logger: Logger;

    beforeEach(() => {
      setChatMessages = mock(() => {});
      showToast = mock(() => {});
      logger = {
        info: mock(() => {}),
        error: mock(() => {}),
        warn: mock(() => {}),
        debug: mock(() => {}),
      } as unknown as Logger;
    });

    test("should show red toast for AIGenerationError", () => {
      const error = new AIGenerationError("AI generation failed");

      handleGenerationError(
        error,
        "generate prompt",
        setChatMessages as any,
        showToast as any,
        logger
      );

      expect(showToast).toHaveBeenCalledTimes(1);
      const [message, type] = showToast.mock.calls[0] as [string, string];
      expect(message).toContain("AI generation failed");
      expect(type).toBe("error");
    });

    test("should show red toast for OllamaUnavailableError", () => {
      const error = new OllamaUnavailableError("http://127.0.0.1:11434");

      handleGenerationError(
        error,
        "generate with Ollama",
        setChatMessages as any,
        showToast as any,
        logger
      );

      expect(showToast).toHaveBeenCalledTimes(1);
      const [message, type] = showToast.mock.calls[0] as [string, string];
      expect(message).toContain("Ollama server not reachable");
      expect(type).toBe("error");
    });

    test("should show red toast for OllamaModelMissingError", () => {
      const error = new OllamaModelMissingError("gemma3:4b");

      handleGenerationError(
        error,
        "generate with model",
        setChatMessages as any,
        showToast as any,
        logger
      );

      expect(showToast).toHaveBeenCalledTimes(1);
      const [message, type] = showToast.mock.calls[0] as [string, string];
      expect(message).toContain("Model gemma3:4b not found");
      expect(type).toBe("error");
    });

    test("should show red toast for StorageError", () => {
      const error = new StorageError("Failed to save session", "write");

      handleGenerationError(
        error,
        "save session",
        setChatMessages as any,
        showToast as any,
        logger
      );

      expect(showToast).toHaveBeenCalledTimes(1);
      const [message, type] = showToast.mock.calls[0] as [string, string];
      expect(message).toContain("Failed to save session");
      expect(type).toBe("error");
    });

    test("should show red toast for InvariantError", () => {
      const error = new InvariantError("Invalid state: session is null");

      handleGenerationError(
        error,
        "update session",
        setChatMessages as any,
        showToast as any,
        logger
      );

      expect(showToast).toHaveBeenCalledTimes(1);
      const [message, type] = showToast.mock.calls[0] as [string, string];
      expect(message).toContain("Invalid state");
      expect(type).toBe("error");
    });

    test("should show orange toast for ValidationError", () => {
      const error = new ValidationError("Prompt too long (1024/1000 characters)");

      handleGenerationError(
        error,
        "validate prompt",
        setChatMessages as any,
        showToast as any,
        logger
      );

      expect(showToast).toHaveBeenCalledTimes(1);
      const [message, type] = showToast.mock.calls[0] as [string, string];
      expect(message).toContain("Prompt too long");
      expect(type).toBe("warning");
    });

    test("should show orange toast for OllamaTimeoutError", () => {
      const error = new OllamaTimeoutError(30000);

      handleGenerationError(
        error,
        "generate with Ollama",
        setChatMessages as any,
        showToast as any,
        logger
      );

      expect(showToast).toHaveBeenCalledTimes(1);
      const [message, type] = showToast.mock.calls[0] as [string, string];
      expect(message).toContain("timed out");
      expect(type).toBe("warning");
    });

    test("should show toast and chat message simultaneously", () => {
      const error = new AIGenerationError("Generation failed");

      handleGenerationError(
        error,
        "generate prompt",
        setChatMessages as any,
        showToast as any,
        logger
      );

      // Toast notification triggered
      expect(showToast).toHaveBeenCalledTimes(1);

      // Chat message added
      expect(setChatMessages).toHaveBeenCalledTimes(1);
      const updateFn = setChatMessages.mock.calls[0]?.[0] as (
        prev: ChatMessage[]
      ) => ChatMessage[];

      const prevMessages: ChatMessage[] = [
        { role: "user", content: "Generate prompt" },
      ];
      const newMessages = updateFn(prevMessages);

      expect(newMessages.length).toBe(2);
      expect(newMessages[1]?.role).toBe("ai");
      expect(newMessages[1]?.content).toContain("Error:");
      expect(newMessages[1]?.content).toContain("Generation failed");
    });

    test("should show red toast for generic Error", () => {
      const error = new Error("Unexpected error occurred");

      handleGenerationError(
        error,
        "perform action",
        setChatMessages as any,
        showToast as any,
        logger
      );

      expect(showToast).toHaveBeenCalledTimes(1);
      const [message, type] = showToast.mock.calls[0] as [string, string];
      expect(message).toContain("Unexpected error occurred");
      expect(type).toBe("error"); // Unknown errors default to 'error'
    });

    test("should show red toast for unknown error types", () => {
      const error = "String error message";

      handleGenerationError(
        error,
        "perform action",
        setChatMessages as any,
        showToast as any,
        logger
      );

      expect(showToast).toHaveBeenCalledTimes(1);
      const [_message, type] = showToast.mock.calls[0] as [string, string];
      expect(type).toBe("error"); // Unknown errors default to 'error'
    });
  });

  describe("Task 4.3: Test Deduplication in Error Scenarios", () => {
    test("getErrorToastType categorizes errors correctly for deduplication", () => {
      // Warnings (should deduplicate separately from errors)
      expect(getErrorToastType(new ValidationError("test"))).toBe("warning");
      expect(getErrorToastType(new OllamaTimeoutError(30000))).toBe("warning");

      // Critical errors
      expect(getErrorToastType(new AIGenerationError("test"))).toBe("error");
      expect(getErrorToastType(new OllamaUnavailableError("http://localhost:11434"))).toBe("error");
      expect(getErrorToastType(new OllamaModelMissingError("gemma3:4b"))).toBe("error");
      expect(getErrorToastType(new StorageError("test", "write"))).toBe("error");
      expect(getErrorToastType(new InvariantError("test"))).toBe("error");

      // Unknown errors default to critical
      expect(getErrorToastType(new Error("unknown"))).toBe("error");
      expect(getErrorToastType("string error")).toBe("error");
    });

    test("same error message with different types should create separate toasts", () => {
      const message = "Operation failed";

      // Simulate two errors with same message but different types
      const validationError = new ValidationError(message);
      const aiError = new AIGenerationError(message);

      const type1 = getErrorToastType(validationError);
      const type2 = getErrorToastType(aiError);

      // Different types should not deduplicate
      expect(type1).toBe("warning");
      expect(type2).toBe("error");
      expect(type1).not.toBe(type2);
    });

    test("rapid identical errors should use same toast type for deduplication", () => {
      const error1 = new OllamaUnavailableError("http://127.0.0.1:11434");
      const error2 = new OllamaUnavailableError("http://127.0.0.1:11434");

      const type1 = getErrorToastType(error1);
      const type2 = getErrorToastType(error2);

      // Same error class should always map to same type
      expect(type1).toBe(type2);
      expect(type1).toBe("error");
    });

    test("chat messages should not be deduplicated (all preserved)", () => {
      const setChatMessages = mock(() => {});
      const showToast = mock(() => {});
      const logger = {
        info: mock(() => {}),
        error: mock(() => {}),
        warn: mock(() => {}),
        debug: mock(() => {}),
      } as unknown as Logger;

      const error = new AIGenerationError("Generation failed");

      // Trigger error 3 times
      for (let i = 0; i < 3; i++) {
        handleGenerationError(
          error,
          "generate prompt",
          setChatMessages as any,
          showToast as any,
          logger
        );
      }

      // showToast called 3 times (deduplication happens in ToastProvider)
      expect(showToast).toHaveBeenCalledTimes(3);

      // setChatMessages also called 3 times (no deduplication in chat)
      expect(setChatMessages).toHaveBeenCalledTimes(3);
    });
  });

  describe("Task 4.4: Test Queue Overflow Scenarios", () => {
    test("simulates 5+ errors triggering queue management logic", () => {
      const setChatMessages = mock(() => {});
      const showToast = mock(() => {});
      const logger = {
        info: mock(() => {}),
        error: mock(() => {}),
        warn: mock(() => {}),
        debug: mock(() => {}),
      } as unknown as Logger;

      // Create 5 different errors
      const errors = [
        new AIGenerationError("Error 1"),
        new StorageError("Error 2", "write"),
        new OllamaUnavailableError("http://localhost:11434"),
        new OllamaModelMissingError("model1"),
        new ValidationError("Error 5"),
      ];

      // Trigger all 5 errors
      errors.forEach((error, i) => {
        handleGenerationError(
          error,
          `action ${i + 1}`,
          setChatMessages as any,
          showToast as any,
          logger
        );
      });

      // All errors should trigger showToast
      expect(showToast).toHaveBeenCalledTimes(5);

      // Verify error categorization
      // AIGenerationError, StorageError, OllamaUnavailableError, OllamaModelMissingError -> error
      // ValidationError -> warning
      const expectedTypes: ("error" | "warning")[] = ["error", "error", "error", "error", "warning"];
      errors.forEach((error, i) => {
        const expectedType = getErrorToastType(error);
        expect(expectedType).toBe(expectedTypes[i]!);
      });
    });

    test("handles 10+ rapid errors gracefully", () => {
      const setChatMessages = mock(() => {});
      const showToast = mock(() => {});
      const logger = {
        info: mock(() => {}),
        error: mock(() => {}),
        warn: mock(() => {}),
        debug: mock(() => {}),
      } as unknown as Logger;

      // Trigger 10 different errors
      for (let i = 0; i < 10; i++) {
        const error = new AIGenerationError(`Error ${i + 1}`);
        handleGenerationError(
          error,
          `action ${i + 1}`,
          setChatMessages as any,
          showToast as any,
          logger
        );
      }

      // All errors should trigger showToast (FIFO handled in ToastProvider)
      expect(showToast).toHaveBeenCalledTimes(10);

      // All errors logged
      expect(logger.error).toHaveBeenCalledTimes(10);

      // All chat messages added
      expect(setChatMessages).toHaveBeenCalledTimes(10);
    });

    test("verifies error categorization is consistent for queue management", () => {
      // Same error type should always produce same toast type
      const errors = [
        new ValidationError("Validation 1"),
        new ValidationError("Validation 2"),
        new ValidationError("Validation 3"),
      ];

      errors.forEach((error) => {
        expect(getErrorToastType(error)).toBe("warning");
      });
    });
  });

  describe("Task 4.5: Test Ollama-Specific Error Scenarios", () => {
    let setChatMessages: ReturnType<typeof mock>;
    let showToast: ReturnType<typeof mock>;
    let logger: Logger;

    beforeEach(() => {
      setChatMessages = mock(() => {});
      showToast = mock(() => {});
      logger = {
        info: mock(() => {}),
        error: mock(() => {}),
        warn: mock(() => {}),
        debug: mock(() => {}),
      } as unknown as Logger;
    });

    test("should show red toast when Ollama unavailable", () => {
      const error = new OllamaUnavailableError("http://127.0.0.1:11434");

      handleGenerationError(
        error,
        "generate with Local LLM",
        setChatMessages as any,
        showToast as any,
        logger
      );

      expect(showToast).toHaveBeenCalledTimes(1);
      const [message, type] = showToast.mock.calls[0] as [string, string];
      
      expect(type).toBe("error");
      expect(message).toContain("Ollama server not reachable");
      expect(message).toContain("http://127.0.0.1:11434");

      // Also added to chat
      expect(setChatMessages).toHaveBeenCalledTimes(1);
    });

    test("should show red toast when model missing", () => {
      const error = new OllamaModelMissingError("gemma3:4b");

      handleGenerationError(
        error,
        "generate with model",
        setChatMessages as any,
        showToast as any,
        logger
      );

      expect(showToast).toHaveBeenCalledTimes(1);
      const [message, type] = showToast.mock.calls[0] as [string, string];
      
      expect(type).toBe("error");
      expect(message).toContain("Model gemma3:4b not found");
      expect(message).toContain("ollama pull");

      // Also added to chat
      expect(setChatMessages).toHaveBeenCalledTimes(1);
    });

    test("should show orange toast on timeout", () => {
      const error = new OllamaTimeoutError(30000);

      handleGenerationError(
        error,
        "generate with Ollama",
        setChatMessages as any,
        showToast as any,
        logger
      );

      expect(showToast).toHaveBeenCalledTimes(1);
      const [message, type] = showToast.mock.calls[0] as [string, string];
      
      expect(type).toBe("warning");
      expect(message).toContain("timed out");
      expect(message).toContain("30");

      // Also added to chat
      expect(setChatMessages).toHaveBeenCalledTimes(1);
    });

    test("should include helpful context in Ollama error messages", () => {
      const unavailableError = new OllamaUnavailableError("http://127.0.0.1:11434");
      const missingModelError = new OllamaModelMissingError("llama3:8b");

      // Unavailable error should mention ensuring Ollama is running
      const unavailableMessage = unavailableError.message;
      expect(unavailableMessage).toContain("ensure Ollama is running");

      // Missing model error should mention ollama pull command
      const missingModelMessage = missingModelError.message;
      expect(missingModelMessage).toContain("ollama pull");
      expect(missingModelMessage).toContain("llama3:8b");
    });

    test("should handle multiple Ollama errors in sequence", () => {
      const errors = [
        new OllamaUnavailableError("http://127.0.0.1:11434"),
        new OllamaModelMissingError("gemma3:4b"),
        new OllamaTimeoutError(30000),
      ];

      errors.forEach((error, i) => {
        handleGenerationError(
          error,
          `Ollama action ${i + 1}`,
          setChatMessages as any,
          showToast as any,
          logger
        );
      });

      expect(showToast).toHaveBeenCalledTimes(3);
      
      // First two are critical errors (red)
      expect(showToast.mock.calls[0]?.[1]).toBe("error");
      expect(showToast.mock.calls[1]?.[1]).toBe("error");
      
      // Third is warning (orange)
      expect(showToast.mock.calls[2]?.[1]).toBe("warning");

      // All logged and added to chat
      expect(logger.error).toHaveBeenCalledTimes(3);
      expect(setChatMessages).toHaveBeenCalledTimes(3);
    });
  });

  describe("Error Message Quality", () => {
    test("error messages are specific and actionable", () => {
      const unavailableError = new OllamaUnavailableError("http://127.0.0.1:11434");
      const missingModelError = new OllamaModelMissingError("gemma3:4b");
      const validationError = new ValidationError("Prompt too long (1024/1000 characters)");

      // Should include specific details
      expect(unavailableError.message).toContain("http://127.0.0.1:11434");
      expect(missingModelError.message).toContain("gemma3:4b");
      expect(validationError.message).toContain("1024/1000");

      // Should provide actionable guidance
      expect(unavailableError.message).toContain("ensure Ollama is running");
      expect(missingModelError.message).toContain("ollama pull gemma3:4b");
    });

    test("error messages avoid technical jargon", () => {
      const error = new OllamaUnavailableError("http://127.0.0.1:11434");
      const message = error.message;

      // User-friendly language
      expect(message).toContain("server not reachable");
      expect(message).toContain("ensure Ollama is running");

      // Avoid technical codes
      expect(message).not.toContain("HTTP_UNAVAILABLE");
      expect(message).not.toContain("ECONNREFUSED");
    });
  });

  describe("Dual Display Strategy", () => {
    test("errors appear in both toast and chat", () => {
      const setChatMessages = mock(() => {});
      const showToast = mock(() => {});
      const logger = {
        info: mock(() => {}),
        error: mock(() => {}),
        warn: mock(() => {}),
        debug: mock(() => {}),
      } as unknown as Logger;

      const error = new AIGenerationError("Generation failed");

      handleGenerationError(
        error,
        "generate prompt",
        setChatMessages as any,
        showToast as any,
        logger
      );

      // Toast notification (immediate feedback)
      expect(showToast).toHaveBeenCalledTimes(1);
      // Toast should be called with error message
      
      // Chat message (permanent history)
      expect(setChatMessages).toHaveBeenCalledTimes(1);
      // Chat messages are added via setState updater function
      // Both toast and chat message should be triggered
    });

    test("toast provides immediate feedback, chat preserves history", () => {
      const setChatMessages = mock(() => {});
      const showToast = mock(() => {});
      const logger = {
        info: mock(() => {}),
        error: mock(() => {}),
        warn: mock(() => {}),
        debug: mock(() => {}),
      } as unknown as Logger;

      // Trigger 3 errors
      for (let i = 0; i < 3; i++) {
        const error = new AIGenerationError(`Error ${i + 1}`);
        handleGenerationError(
          error,
          `action ${i + 1}`,
          setChatMessages as any,
          showToast as any,
          logger
        );
      }

      // Toast called 3 times (may deduplicate in provider)
      expect(showToast).toHaveBeenCalledTimes(3);

      // Chat called 3 times (all errors preserved)
      expect(setChatMessages).toHaveBeenCalledTimes(3);
    });
  });
});

describe("Error Categorization Edge Cases", () => {
  test("handles null and undefined errors", () => {
    expect(getErrorToastType(null)).toBe("error");
    expect(getErrorToastType(undefined)).toBe("error");
  });

  test("handles non-Error objects", () => {
    expect(getErrorToastType({ message: "custom error" })).toBe("error");
    expect(getErrorToastType(42)).toBe("error");
    expect(getErrorToastType(true)).toBe("error");
  });

  test("handles Error subclasses not in categorization list", () => {
    class CustomError extends Error {}
    const error = new CustomError("Custom error occurred");
    
    expect(getErrorToastType(error)).toBe("error");
  });
});
