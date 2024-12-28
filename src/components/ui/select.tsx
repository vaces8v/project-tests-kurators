// Placeholder Select component
import * as React from "react"

export const Select = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
)

export const SelectContent = ({ children }: { children: React.ReactNode }) => (
  <div>{children}</div>
)

export const SelectTrigger = ({ children }: { children: React.ReactNode }) => (
  <button>{children}</button>
)

export const SelectValue = ({ children }: { children: React.ReactNode }) => (
  <span>{children}</span>
)

export const SelectItem = ({ children }: { children: React.ReactNode }) => (
  <option>{children}</option>
)
