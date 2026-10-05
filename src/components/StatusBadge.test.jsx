import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StatusBadge from "./StatusBadge";

describe("StatusBadge", () => {
  it("exibe rótulos legíveis para todos os estados de validade", () => {
    const { rerender } = render(<StatusBadge status="VERDE" />);
    expect(screen.getByText("Regular")).toBeInTheDocument();
    rerender(<StatusBadge status="AMARELO" />);
    expect(screen.getByText("Atenção")).toBeInTheDocument();
    rerender(<StatusBadge status="VERMELHO" />);
    expect(screen.getByText("Crítico")).toBeInTheDocument();
    rerender(<StatusBadge status="EXPIRADO" />);
    expect(screen.getByText("Vencido")).toBeInTheDocument();
  });

  it("permite rótulo contextual fornecido pelo chamador", () => {
    render(<StatusBadge status="VERDE">Dentro da validade</StatusBadge>);
    expect(screen.getByText("Dentro da validade")).toBeInTheDocument();
  });
});
