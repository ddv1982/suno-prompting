import { describe, test, expect } from "bun:test";

import {
  validateOllamaEndpoint,
  InvalidOllamaEndpointError,
  ValidationError,
} from "@shared/errors";
import { SetOllamaSettingsSchema } from "@shared/schemas";

describe("SSRF Prevention: validateOllamaEndpoint", () => {
  describe("valid endpoints", () => {
    const validEndpoints = [
      "http://127.0.0.1:11434",
      "http://localhost:11434",
      "http://localhost:8080",
      "http://127.0.0.1:8080",
      "http://[::1]:11434",
      "https://127.0.0.1:11434",
      "https://localhost:11434",
      // Note: Default ports (80 for http, 443 for https) are rejected
      // as they are privileged ports. Users must explicitly specify a port.
    ];

    validEndpoints.forEach((endpoint) => {
      test(`should accept valid endpoint: ${endpoint}`, () => {
        expect(() => validateOllamaEndpoint(endpoint)).not.toThrow();
      });
    });
  });

  describe("IPv6 localhost variations (bypass attempts)", () => {
    const bypassAttempts = [
      // IPv4-mapped IPv6 addresses (with brackets)
      "http://[::ffff:127.0.0.1]:11434",
      "http://[0:0:0:0:0:ffff:127.0.0.1]:11434",
      "http://[0:0:0:0:0:ffff:7f00:1]:11434",
      "http://[::ffff:7f00:1]:11434",
      // Incomplete IPv6 (bypass technique)
      "http://[::]:11434",
      "http://[0:0:0:0:0:0:0:0]:11434",
      // Compressed zeros
      "http://[0::ffff:127.0.0.1]:11434",
      "http://[::ffff:7f00:1]:11434",
    ];

    bypassAttempts.forEach((endpoint) => {
      test(`should block IPv6 bypass attempt: ${endpoint}`, () => {
        expect(() => validateOllamaEndpoint(endpoint)).toThrow(
          InvalidOllamaEndpointError
        );
      });
    });

    const invalidFormats = [
      // Without brackets (URL parsing fails)
      "http://::ffff:127.0.0.1:11434",
      "http://0:0:0:0:0:ffff:127.0.0.1:11434",
    ];

    invalidFormats.forEach((endpoint) => {
      test(`should reject invalid IPv6 format: ${endpoint}`, () => {
        expect(() => validateOllamaEndpoint(endpoint)).toThrow(ValidationError);
      });
    });
  });

  describe("non-localhost endpoints", () => {
    const invalidEndpoints = [
      "http://example.com:11434",
      "http://192.168.1.1:11434", // Private network
      "http://10.0.0.1:11434", // Private network
      "http://172.16.0.1:11434", // Private network
      "http://0.0.0.0:11434",
      "http://8.8.8.8:11434", // Public IP
      "http://malicious-site.com:11434",
      "http://127.0.0.2:11434", // Close but not exact
      "http://127.1.0.1:11434", // Variation
    ];

    invalidEndpoints.forEach((endpoint) => {
      test(`should reject non-localhost endpoint: ${endpoint}`, () => {
        expect(() => validateOllamaEndpoint(endpoint)).toThrow(
          InvalidOllamaEndpointError
        );
      });
    });

    // Note: Octal and decimal IP representations (e.g., 0177.0.0.1, 2130706433)
    // are accepted by URL parser as valid URLs. These would require DNS resolution
    // to detect, which is a potential future enhancement.
  });

  describe("protocol validation", () => {
    const invalidProtocols = [
      "ftp://127.0.0.1:11434",
      "file://127.0.0.1",
      "ws://127.0.0.1:11434",
      "wss://127.0.0.1:11434",
      "gopher://127.0.0.1",
      "dict://127.0.0.1",
    ];

    invalidProtocols.forEach((endpoint) => {
      test(`should reject invalid protocol: ${endpoint}`, () => {
        expect(() => validateOllamaEndpoint(endpoint)).toThrow(
          InvalidOllamaEndpointError
        );
      });
    });
  });

  describe("port validation", () => {
    test("should accept valid port range", () => {
      expect(() => validateOllamaEndpoint("http://127.0.0.1:1024")).not.toThrow();
      expect(() => validateOllamaEndpoint("http://127.0.0.1:65535")).not.toThrow();
      expect(() => validateOllamaEndpoint("http://localhost:11434")).not.toThrow();
    });

    test("should reject privileged ports (< 1024)", () => {
      expect(() => validateOllamaEndpoint("http://127.0.0.1:80")).toThrow(
        ValidationError
      );
      expect(() => validateOllamaEndpoint("http://127.0.0.1:22")).toThrow(
        ValidationError
      );
      expect(() => validateOllamaEndpoint("http://127.0.0.1:443")).toThrow(
        ValidationError
      );
    });

    test("should reject URLs without explicit port (uses default privileged port)", () => {
      // http defaults to port 80 (privileged)
      expect(() => validateOllamaEndpoint("http://127.0.0.1")).toThrow(
        ValidationError
      );
      expect(() => validateOllamaEndpoint("http://localhost")).toThrow(
        ValidationError
      );
      expect(() => validateOllamaEndpoint("http://[::1]")).toThrow(
        ValidationError
      );
    });

    test("should reject invalid port (> 65535)", () => {
      expect(() => validateOllamaEndpoint("http://127.0.0.1:70000")).toThrow(
        ValidationError
      );
    });

    test("should reject port 0", () => {
      expect(() => validateOllamaEndpoint("http://127.0.0.1:0")).toThrow(
        ValidationError
      );
    });
  });

  describe("invalid URL formats", () => {
    const invalidUrls = [
      "not-a-url",
      "://missing-protocol",
      "http://",
      "localhost:11434", // Missing protocol
      "127.0.0.1:11434", // Missing protocol
    ];

    invalidUrls.forEach((endpoint) => {
      test(`should reject invalid URL: ${endpoint}`, () => {
        expect(() => validateOllamaEndpoint(endpoint)).toThrow(ValidationError);
      });
    });
  });
});

describe("Zod Schema: SetOllamaSettingsSchema", () => {
  describe("endpoint validation", () => {
    test("should accept valid localhost endpoint", () => {
      const result = SetOllamaSettingsSchema.safeParse({
        endpoint: "http://127.0.0.1:11434",
      });
      expect(result.success).toBe(true);
    });

    // Note: The refine function in SetOllamaSettingsSchema calls validateOllamaEndpoint
    // which throws detailed errors. These tests verify the errors are properly propagated.
    // The specific error message from validateOllamaEndpoint is preferred over
    // generic Zod refine messages.

    test("should reject non-localhost endpoint with detailed error", () => {
      const result = SetOllamaSettingsSchema.safeParse({
        endpoint: "http://example.com:11434",
      });
      expect(result.success).toBe(false);
      if (!result.success && result.error?.issues?.[0]) {
        expect(result.error.issues[0].path).toContain("endpoint");
        // Error should include the specific endpoint
        expect(result.error.issues[0].message).toContain("example.com");
      }
    });

    test("should reject IPv4-mapped IPv6 bypass with detailed error", () => {
      const result = SetOllamaSettingsSchema.safeParse({
        endpoint: "http://[::ffff:127.0.0.1]:11434",
      });
      expect(result.success).toBe(false);
      if (!result.success && result.error?.issues?.[0]) {
        expect(result.error.issues[0].path).toContain("endpoint");
        expect(result.error.issues[0].message).toContain("::ffff");
      }
    });

    test("should reject invalid protocol", () => {
      const result = SetOllamaSettingsSchema.safeParse({
        endpoint: "ftp://127.0.0.1:11434",
      });
      expect(result.success).toBe(false);
      if (!result.success && result.error?.issues?.[0]) {
        expect(result.error.issues[0].path).toContain("endpoint");
        // Note: The URL regex catches invalid protocols before superRefine
        expect(result.error.issues[0].message).toContain("valid URL");
      }
    });

    test("should reject privileged port (explicit) with detailed error", () => {
      const result = SetOllamaSettingsSchema.safeParse({
        endpoint: "http://127.0.0.1:80",
      });
      expect(result.success).toBe(false);
      if (!result.success && result.error?.issues?.[0]) {
        expect(result.error.issues[0].path).toContain("endpoint");
        expect(result.error.issues[0].message).toContain("80");
        expect(result.error.issues[0].message).toContain("1024");
      }
    });

    test("should reject default privileged port (implicit) with detailed error", () => {
      const result = SetOllamaSettingsSchema.safeParse({
        endpoint: "http://127.0.0.1", // Uses port 80
      });
      expect(result.success).toBe(false);
      if (!result.success && result.error?.issues?.[0]) {
        expect(result.error.issues[0].path).toContain("endpoint");
        expect(result.error.issues[0].message).toContain("80");
        expect(result.error.issues[0].message).toContain("1024");
      }
    });
  });

  describe("other fields", () => {
    test("should accept valid temperature", () => {
      const result = SetOllamaSettingsSchema.safeParse({
        temperature: 0.7,
      });
      expect(result.success).toBe(true);
    });

    test("should reject temperature out of range", () => {
      const result = SetOllamaSettingsSchema.safeParse({
        temperature: 1.5,
      });
      expect(result.success).toBe(false);

      const result2 = SetOllamaSettingsSchema.safeParse({
        temperature: -0.5,
      });
      expect(result2.success).toBe(false);
    });

    test("should accept valid maxTokens", () => {
      const result = SetOllamaSettingsSchema.safeParse({
        maxTokens: 2048,
      });
      expect(result.success).toBe(true);
    });

    test("should reject maxTokens out of range", () => {
      const result = SetOllamaSettingsSchema.safeParse({
        maxTokens: 4001,
      });
      expect(result.success).toBe(false);

      const result2 = SetOllamaSettingsSchema.safeParse({
        maxTokens: 499,
      });
      expect(result2.success).toBe(false);
    });

    test("should accept valid contextLength", () => {
      const result = SetOllamaSettingsSchema.safeParse({
        contextLength: 4096,
      });
      expect(result.success).toBe(true);
    });

    test("should reject contextLength out of range", () => {
      const result = SetOllamaSettingsSchema.safeParse({
        contextLength: 8193,
      });
      expect(result.success).toBe(false);

      const result2 = SetOllamaSettingsSchema.safeParse({
        contextLength: 2047,
      });
      expect(result2.success).toBe(false);
    });
  });

  test("should accept empty object (all fields optional)", () => {
    const result = SetOllamaSettingsSchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
