import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { formatConcentration, saveSession, simulateMixture } from "../api/client";

describe("formatConcentration", () => {
  it("keeps integers clean", () => {
    expect(formatConcentration(1)).toBe("1");
  });

  it("trims trailing zeros", () => {
    expect(formatConcentration(0.5)).toBe("0.5");
    expect(formatConcentration(0.50001)).toBe("0.5");
  });
});

describe("simulateMixture session refresh", () => {
  const memory: Record<string, string> = {};

  beforeEach(() => {
    for (const key of Object.keys(memory)) delete memory[key];
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => memory[key] ?? null,
      setItem: (key: string, value: string) => {
        memory[key] = value;
      },
      removeItem: (key: string) => {
        delete memory[key];
      },
    });
    vi.stubGlobal("window", {
      dispatchEvent: vi.fn(),
    });
    saveSession({
      access_token: "old-access",
      refresh_token: "refresh-token",
      token_type: "bearer",
      user: {
        id: "u1",
        email: "aluno@example.com",
        full_name: "Aluno",
        role: "aluno",
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("renews the access token after 401 and retries the simulation", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ detail: "Sessão inválida ou expirada. Faça login novamente." }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          access_token: "new-access",
          refresh_token: "new-refresh",
          token_type: "bearer",
          user: {
            id: "u1",
            email: "aluno@example.com",
            full_name: "Aluno",
            role: "aluno",
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          total_volume_ml: 10,
          solutes: [],
          logs: [],
          warnings: [],
        }),
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await simulateMixture([{ reagent_id: "el-H", volume_ml: 10 }]);
    expect(result.total_volume_ml).toBe(10);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(memory.quimix_access_token).toBe("new-access");
  });
});
