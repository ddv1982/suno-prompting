# Code Review Fix Plan

**Date**: January 9, 2026  
**Based on**: CODE_REVIEW_REPORT.md  
**Priority System**: Critical > High > Medium > Low  
**Total Issues**: 9 (0 Critical, 3 Major, 2 Minor, 4 Suggestions)

---

## Quick Stats

| Priority | Count | Est. Effort | Est. Time |
|----------|-------|-------------|-----------|
| Critical | 0 | - | - |
| High | 3 | Medium | 6-8 hours |
| Medium | 2 | Low-Medium | 3-4 hours |
| Low | 4 | Low-High | 12-20 hours |
| **TOTAL** | **9** | - | **21-32 hours** |

---

## Phase 1: Immediate Fixes (Sprint 1 - Week 1)

**Goal**: Fix high-priority issues that are quick wins  
**Total Effort**: 3.5-4 hours  
**Assignable to**: Single developer

### Issue #1: Fix Floating Promises in Tests ⚡

**Priority**: High  
**Effort**: 30 minutes  
**Files**: 5 test files

**Changes Required**:

```typescript
// File: tests/ai-refinement.test.ts (2 fixes)
// BEFORE:
mock.module('./api-client', () => ({ ... }));

// AFTER:
await mock.module('./api-client', () => ({ ... }));
```

**Files to modify**:
1. `tests/ai-refinement.test.ts` - Lines 12, 17
2. `tests/generation.test.ts` - Line 12
3. `tests/ollama-handlers.test.ts` - Line 17
4. `tests/ollama-remix.test.ts` - Lines 12, 24

**Verification**:
```bash
bun run lint  # Should show 3 fewer warnings
bun test      # All tests should still pass
```

**PR Title**: `fix: await async mock.module calls in tests`

---

### Issue #2: Add Explicit Error Types to Catch Blocks ⚡

**Priority**: Medium-High  
**Effort**: 2-3 hours  
**Files**: 30+ files across codebase

**Pattern to apply consistently**:

```typescript
// BEFORE (inconsistent):
} catch (error) {      // implicitly any
} catch (e) {          // too generic
} catch (err: any) {   // explicit any (bad)

// AFTER (consistent):
} catch (error: unknown) {
  log.error('operation:failed', error);
  throw new AppError(
    'Operation failed',
    'OPERATION_ERROR',
    error as Error
  );
}
```

**Target Files** (prioritized by importance):

**High Priority** (Core business logic):
1. `src/bun/handlers/validated.ts` - 2 occurrences
2. `src/bun/handlers/utils.ts` - 1 occurrence
3. `src/bun/ai/content-generator.ts` - 3 occurrences
4. `src/bun/ai/llm-rewriter.ts` - 3 occurrences
5. `src/bun/ai/llm-utils.ts` - 2 occurrences
6. `src/bun/crypto.ts` - 1 occurrence (already has proper error handling, just needs typing)
7. `src/bun/storage.ts` - 7 occurrences

**Medium Priority** (AI operations):
8. `src/bun/ai/creative-boost/refine.ts` - 2 occurrences
9. `src/bun/ai/ollama-availability.ts` - 1 occurrence
10. `src/bun/ai/refinement.ts` - 2 occurrences

**Low Priority** (Frontend):
11. `src/main-ui/hooks/use-generation-action.ts` - 1 occurrence
12. `src/main-ui/hooks/use-async-action.ts` - 2 occurrences
13. `src/main-ui/components/prompt-editor/main-input.tsx` - 1 occurrence
14. `src/main-ui/components/history-sidebar.tsx` - 1 occurrence

**Batch Process Strategy**:
1. Create helper script to identify patterns
2. Fix all backend files first (highest risk)
3. Fix frontend files second
4. Run full test suite after each batch

**Verification**:
```bash
bun run typecheck  # Should still pass with better types
bun test          # All tests pass
```

**PR Title**: `refactor: add explicit error types to catch blocks`

---

### Issue #3: Replace console.error in ErrorBoundary ⚡

**Priority**: Low  
**Effort**: 15 minutes  
**Files**: 1 file

**Change**:

```typescript
// File: src/main-ui/components/error-boundary.tsx
// BEFORE:
console.error('React Error Boundary caught:', error, info);

// AFTER:
import { createLogger } from '@/lib/logger';
const log = createLogger('ErrorBoundary');

// In componentDidCatch:
log.error('boundary:error', { 
  error, 
  componentStack: info.componentStack 
});
```

**Verification**:
```bash
# Manual test: Trigger error boundary and check logs
bun run dev
# Cause an error in a component
```

**PR Title**: `fix: use structured logging in ErrorBoundary`

---

## Phase 2: Structural Improvements (Sprint 1 - Week 2)

**Goal**: Improve maintainability and testability  
**Total Effort**: 6-10 hours  
**Assignable to**: 1-2 developers

### Issue #4: Refactor Oversized Functions 🔨

**Priority**: High  
**Effort**: 4-6 hours  
**Files**: 3 components/hooks

#### 4a. OllamaSettings Component (226 lines → ~60 lines)

**File**: `src/main-ui/components/settings-modal/ollama-settings.tsx`

**Refactoring Strategy**:

```typescript
// NEW FILES TO CREATE:

// 1. hooks/use-ollama-status.ts (40 lines)
export function useOllamaStatus() {
  const [status, setStatus] = useState<OllamaStatus>('checking');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const checkStatus = useCallback(async () => {
    // Status checking logic here
  }, []);
  
  return { status, isRefreshing, checkStatus };
}

// 2. hooks/use-ollama-settings.ts (50 lines)
export function useOllamaSettings() {
  const [settings, setSettings] = useState<OllamaSettings>(defaults);
  
  const updateSetting = useCallback((key, value) => {
    // Update logic here
  }, []);
  
  return { settings, updateSetting, saveSettings };
}

// 3. components/settings-modal/ollama-status-section.tsx (40 lines)
export function OllamaStatusSection({ status, onRefresh }) {
  // Just rendering, no logic
}

// 4. components/settings-modal/ollama-endpoint-section.tsx (35 lines)
export function OllamaEndpointSection({ endpoint, onChange }) {
  // Just rendering, no logic
}

// 5. components/settings-modal/ollama-model-section.tsx (45 lines)
export function OllamaModelSection({ status }) {
  // Model installation UI
}

// UPDATED FILE:
// settings-modal/ollama-settings.tsx (60 lines)
export function OllamaSettings(): React.JSX.Element {
  const { status, checkStatus, isRefreshing } = useOllamaStatus();
  const { settings, updateSetting } = useOllamaSettings();
  
  return (
    <div className="space-y-6">
      <OllamaStatusSection 
        status={status} 
        onRefresh={checkStatus}
        isRefreshing={isRefreshing}
      />
      <OllamaEndpointSection 
        endpoint={settings.endpoint}
        onChange={(val) => updateSetting('endpoint', val)}
      />
      {status === 'missing-model' && <OllamaModelSection />}
      <OllamaAdvancedSettings 
        settings={settings}
        onChange={updateSetting}
      />
    </div>
  );
}
```

**Benefits**:
- ✅ Each hook/component has single responsibility
- ✅ Easy to test in isolation
- ✅ Can reuse hooks in other components
- ✅ Better code organization

**Testing Strategy**:
```typescript
// tests/use-ollama-status.test.ts
describe('useOllamaStatus', () => {
  test('checks status on mount', async () => {
    const { result } = renderHook(() => useOllamaStatus());
    await waitFor(() => expect(result.current.status).not.toBe('checking'));
  });
});

// tests/ollama-settings.test.tsx
describe('OllamaSettings', () => {
  test('renders all sections', () => {
    render(<OllamaSettings />);
    expect(screen.getByText(/status/i)).toBeInTheDocument();
    expect(screen.getByText(/endpoint/i)).toBeInTheDocument();
  });
});
```

**Verification**:
```bash
bun test tests/use-ollama-status.test.ts
bun test tests/ollama-settings.test.tsx
bun run lint  # No more "too many lines" warning
```

---

#### 4b. FullPromptInputPanel Component (106 lines → ~40 lines)

**File**: `src/main-ui/components/prompt-editor/full-prompt-input-panel.tsx`

**Problem**: Takes 15+ props, does too much

**Refactoring Strategy**:

```typescript
// 1. Extract hook: use-full-prompt-state.ts
export function useFullPromptState() {
  // Consolidate all state management
  const [pendingInput, setPendingInput] = useState('');
  const [lockedPhrase, setLockedPhrase] = useState('');
  // ... all state
  
  return {
    state: { pendingInput, lockedPhrase, /* ... */ },
    actions: { 
      updatePendingInput: setPendingInput,
      updateLockedPhrase: setLockedPhrase,
      // ...
    }
  };
}

// 2. Simplify component
export function FullPromptInputPanel(props) {
  // Use consolidated props interface
  return (
    <div className="space-y-4">
      <ModeToggle {...props.modeProps} />
      <MainInput {...props.inputProps} />
      {props.showAdvanced && <AdvancedPanel {...props.advancedProps} />}
      <FullWidthSubmitButton {...props.submitProps} />
    </div>
  );
}

// 3. Create prop groups to reduce prop count
interface FullPromptInputPanelProps {
  modeProps: ModeToggleProps;
  inputProps: MainInputProps;
  advancedProps: AdvancedPanelProps;
  submitProps: SubmitButtonProps;
  showAdvanced: boolean;
}
```

**Benefits**:
- ✅ Reduced prop drilling
- ✅ Clearer component structure
- ✅ Easier to test sections independently

---

#### 4c. useRemixActions Hook (108 lines → ~60 lines)

**File**: `src/main-ui/hooks/use-remix-actions.ts`

**Refactoring Strategy**:

```typescript
// 1. Extract shared logic: remix-action-executor.ts
export function createRemixExecutor(deps: RemixActionDeps) {
  return async function executeRemix(
    action: RemixAction,
    apiCall: () => Promise<RemixResult>
  ) {
    // Common execution logic (validation, error handling, state updates)
  };
}

// 2. Simplified hook
export function useRemixActions(deps: RemixActionDeps): RemixActions {
  const executeRemix = useMemo(() => createRemixExecutor(deps), [deps]);
  
  return {
    handleRemixInstruments: () => executeRemix('remix-instruments', 
      () => api.remixInstruments(/* ... */)
    ),
    handleRemixGenre: () => executeRemix('remix-genre',
      () => api.remixGenre(/* ... */)
    ),
    // ... other actions follow same pattern
  };
}
```

**Benefits**:
- ✅ DRY - no repeated logic
- ✅ Easier to add new remix actions
- ✅ Consistent error handling

---

**PR Title**: `refactor: split oversized components and hooks`

---

## Phase 3: Test Coverage Improvements (Sprint 2)

**Goal**: Reach 70% coverage across all areas  
**Total Effort**: 8-12 hours  
**Assignable to**: 1-2 developers

### Issue #5: Add Critical UI Component Tests 🧪

**Priority**: Medium  
**Effort**: 4-6 hours  
**Target Components**: 8 components

**Test Plan**:

#### Group 1: Mode/Toggle Components (2 hours)

```typescript
// tests/components/mode-toggle.test.tsx
describe('ModeToggle', () => {
  test('renders all mode options', () => {
    render(<ModeToggle currentMode="deterministic" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /full control/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /quick vibes/i })).toBeInTheDocument();
  });
  
  test('calls onChange when mode is clicked', async () => {
    const onChange = vi.fn();
    render(<ModeToggle currentMode="deterministic" onChange={onChange} />);
    
    await userEvent.click(screen.getByRole('button', { name: /quick vibes/i }));
    expect(onChange).toHaveBeenCalledWith('quick-vibes');
  });
  
  test('disables buttons when disabled prop is true', () => {
    render(<ModeToggle currentMode="deterministic" onChange={vi.fn()} disabled />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach(btn => expect(btn).toBeDisabled());
  });
});

// tests/components/creative-boost-mode-toggle.test.tsx
// tests/components/generation-mode-toggle.test.tsx (if exists)
```

**Files to test**:
1. `src/main-ui/components/prompt-editor/mode-toggle.tsx`
2. `src/main-ui/components/creative-boost-panel/creative-boost-mode-toggle.tsx`

---

#### Group 2: Settings Modal Components (2-3 hours)

```typescript
// tests/components/settings-modal.test.tsx
describe('SettingsModal', () => {
  test('opens when open prop is true', () => {
    render(<SettingsModal open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
  
  test('displays all settings sections', () => {
    render(<SettingsModal open={true} onOpenChange={vi.fn()} />);
    expect(screen.getByText(/api key/i)).toBeInTheDocument();
    expect(screen.getByText(/model/i)).toBeInTheDocument();
    expect(screen.getByText(/feature toggles/i)).toBeInTheDocument();
  });
  
  test('saves settings when save button is clicked', async () => {
    const mockSave = vi.fn();
    vi.mocked(api.saveSettings).mockResolvedValue();
    
    render(<SettingsModal open={true} onOpenChange={vi.fn()} />);
    
    // Change a setting
    await userEvent.type(screen.getByLabelText(/api key/i), 'sk-test123');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));
    
    await waitFor(() => {
      expect(api.saveSettings).toHaveBeenCalled();
    });
  });
});

// tests/components/api-key-section.test.tsx
// tests/components/model-section.test.tsx
// tests/components/feature-toggles.test.tsx
```

**Files to test**:
1. `src/main-ui/components/settings-modal/settings-modal.tsx`
2. `src/main-ui/components/settings-modal/api-key-section.tsx`
3. `src/main-ui/components/settings-modal/model-section.tsx`
4. `src/main-ui/components/settings-modal/feature-toggles.tsx`

---

#### Group 3: Submit/Generate Buttons (1 hour)

```typescript
// tests/components/full-width-submit-button.test.tsx
describe('FullWidthSubmitButton', () => {
  test('shows loading state when generating', () => {
    render(<FullWidthSubmitButton isGenerating={true} onClick={vi.fn()} />);
    expect(screen.getByText(/generating/i)).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });
  
  test('is disabled when disabled prop is true', () => {
    render(<FullWidthSubmitButton disabled={true} onClick={vi.fn()} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });
  
  test('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    render(<FullWidthSubmitButton onClick={onClick} />);
    
    await userEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });
});

// Similar tests for:
// tests/components/submit-button.test.tsx (Quick Vibes)
// tests/components/creative-boost-submit-button.test.tsx
```

**Files to test**:
1. `src/main-ui/components/prompt-editor/full-width-submit-button.tsx`
2. `src/main-ui/components/quick-vibes-panel/submit-button.tsx`

---

**Target Coverage After Phase 3**:
```
Current:  Components: 0%
Goal:     Components: 60%+ (8 critical components tested)
```

**Verification**:
```bash
bun test --coverage
# Check coverage report for components/
```

**PR Title**: `test: add comprehensive UI component tests`

---

### Issue #6: Add Custom Hook Tests 🧪

**Priority**: Medium  
**Effort**: 2-3 hours  
**Target Hooks**: 4 hooks

**Test Plan**:

```typescript
// tests/hooks/use-async-action.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAsyncAction } from '@/hooks/use-async-action';

describe('useAsyncAction', () => {
  test('executes action and updates state', async () => {
    const mockAction = vi.fn().mockResolvedValue('result');
    const { result } = renderHook(() => useAsyncAction(mockAction));
    
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    
    act(() => {
      result.current.execute();
    });
    
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.error).toBeNull();
    expect(mockAction).toHaveBeenCalled();
  });
  
  test('sets error state when action fails', async () => {
    const mockAction = vi.fn().mockRejectedValue(new Error('Failed'));
    const { result } = renderHook(() => useAsyncAction(mockAction));
    
    act(() => {
      result.current.execute();
    });
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.error).toBe('Failed');
  });
  
  test('can retry after error', async () => {
    const mockAction = vi.fn()
      .mockRejectedValueOnce(new Error('Failed'))
      .mockResolvedValueOnce('success');
    
    const { result } = renderHook(() => useAsyncAction(mockAction));
    
    // First attempt fails
    act(() => { result.current.execute(); });
    await waitFor(() => expect(result.current.error).toBeTruthy());
    
    // Retry succeeds
    act(() => { result.current.execute(); });
    await waitFor(() => expect(result.current.error).toBeNull());
  });
});

// tests/hooks/use-debounce.test.ts
describe('useDebounce', () => {
  test('debounces value updates', async () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 500 } }
    );
    
    expect(result.current).toBe('initial');
    
    // Update value
    rerender({ value: 'updated', delay: 500 });
    
    // Value should not update immediately
    expect(result.current).toBe('initial');
    
    // After delay, value should update
    await waitFor(() => {
      expect(result.current).toBe('updated');
    }, { timeout: 600 });
  });
});

// tests/hooks/use-mounted.test.ts
describe('useMounted', () => {
  test('returns true when component is mounted', () => {
    const { result } = renderHook(() => useMounted());
    expect(result.current.current).toBe(true);
  });
  
  test('sets to false on unmount', () => {
    const { result, unmount } = renderHook(() => useMounted());
    expect(result.current.current).toBe(true);
    
    unmount();
    expect(result.current.current).toBe(false);
  });
});

// tests/hooks/use-generation-state.test.ts
// (More complex - test discriminated union state transitions)
```

**Files to test**:
1. `src/main-ui/hooks/use-async-action.ts` (144 lines, 0% coverage)
2. `src/main-ui/hooks/use-debounce.ts` (71 lines, 0% coverage)
3. `src/main-ui/hooks/use-mounted.ts` (30 lines, 0% coverage)
4. `src/main-ui/hooks/use-generation-state.ts`

**Target Coverage After**:
```
Current:  Hooks: 0%
Goal:     Hooks: 80%+ (4 critical hooks tested)
```

**PR Title**: `test: add comprehensive custom hook tests`

---

## Phase 4: Optional Improvements (Future)

**Goal**: Nice-to-have enhancements  
**Total Effort**: 12-20 hours  
**Assignable to**: Junior developer or intern

### Issue #7: Complete UI Test Coverage

**Priority**: Low  
**Effort**: 8-12 hours  
**Remaining Components**: All untested UI components

**Target**: Reach 70% coverage on:
- `src/main-ui/components/ui/` (button, combobox, command, dialog, etc.)
- `src/main-ui/components/` (remaining untested components)

**Strategy**: Test-a-thon session or spread across sprints

---

### Issue #8: Add Error Boundary Wrapping

**Priority**: Low  
**Effort**: 1 hour  
**Files**: App structure

**Changes**:
```typescript
// src/main-ui/index.tsx
import { ErrorBoundary } from '@/components/error-boundary';

function App() {
  return (
    <ErrorBoundary fallback={<AppCrashScreen />}>
      <AppProvider>
        <ErrorBoundary fallback={<SettingsErrorScreen />}>
          <SettingsModal />
        </ErrorBoundary>
        <ErrorBoundary fallback={<EditorErrorScreen />}>
          <PromptEditorContainer />
        </ErrorBoundary>
      </AppProvider>
    </ErrorBoundary>
  );
}
```

**Benefits**: Better error isolation

---

### Issue #9: Consider Dependency Injection Refactor

**Priority**: Low  
**Effort**: 6-8 hours  
**Scope**: Storage layer

**Current Problem**: `StorageManager` is tightly coupled to filesystem

**Proposed Solution**:
```typescript
// 1. Define interface
interface IStorageProvider {
  getHistory(): Promise<PromptSession[]>;
  saveHistory(sessions: PromptSession[]): Promise<void>;
  getConfig(): Promise<AppConfig>;
  saveConfig(config: AppConfig): Promise<void>;
}

// 2. Implement providers
class FileSystemStorage implements IStorageProvider { }
class InMemoryStorage implements IStorageProvider { }

// 3. Inject via context
<StorageProvider storage={new FileSystemStorage()}>
  <App />
</StorageProvider>

// 4. Use in components
const storage = useStorage();
await storage.getConfig();
```

**Benefits**:
- ✅ Easy to test with InMemoryStorage
- ✅ Could support cloud sync later
- ✅ Better separation of concerns

**Tradeoff**: Adds complexity, may be over-engineering for current needs

---

### Issue #10: Document `any` Type Exceptions

**Priority**: Low  
**Effort**: 30 minutes  
**Files**: Type definition files

**Changes**:
```typescript
// src/types/electrobun/view.d.ts
/**
 * Electrobun RPC type definition.
 * 
 * Note: Uses `any` return type because Electrobun's API is dynamically typed.
 * This is an acceptable exception to our "never use any" rule as it's:
 * 1. Limited to external library type definitions
 * 2. Not used in implementation code
 * 3. Properly typed at usage sites
 * 
 * @see https://electrobun.dev/docs/rpc
 */
static defineRPC<TSchema>(config: unknown): any;
```

**PR Title**: `docs: document any type exceptions in Electrobun definitions`

---

## Summary Timeline

### Sprint 1 - Week 1 (Immediate)
- ✅ Issue #1: Fix floating promises (30 min)
- ✅ Issue #2: Explicit error types (2-3 hours)
- ✅ Issue #3: Replace console.error (15 min)
- **Total**: ~3.5-4 hours

### Sprint 1 - Week 2 (Structural)
- ✅ Issue #4a: Refactor OllamaSettings (2-3 hours)
- ✅ Issue #4b: Refactor FullPromptInputPanel (1-2 hours)
- ✅ Issue #4c: Refactor useRemixActions (1 hour)
- **Total**: ~4-6 hours

### Sprint 2 (Testing)
- ✅ Issue #5: Critical UI tests (4-6 hours)
- ✅ Issue #6: Custom hook tests (2-3 hours)
- **Total**: ~6-9 hours

### Future (Optional)
- ⚪ Issue #7: Complete UI coverage (8-12 hours)
- ⚪ Issue #8: Error boundaries (1 hour)
- ⚪ Issue #9: DI refactor (6-8 hours)
- ⚪ Issue #10: Document exceptions (30 min)
- **Total**: ~16-21 hours

---

## Progress Tracking

Use this checklist to track progress:

### Phase 1: Immediate ✅
- [ ] #1: Fix floating promises in tests
- [ ] #2: Add explicit error types to catch blocks
- [ ] #3: Replace console.error in ErrorBoundary

### Phase 2: Structural 🔨
- [ ] #4a: Refactor OllamaSettings component
- [ ] #4b: Refactor FullPromptInputPanel component
- [ ] #4c: Refactor useRemixActions hook

### Phase 3: Testing 🧪
- [ ] #5: Add critical UI component tests
- [ ] #6: Add custom hook tests

### Phase 4: Optional ⚪
- [ ] #7: Complete UI test coverage
- [ ] #8: Add error boundary wrapping
- [ ] #9: Dependency injection refactor
- [ ] #10: Document `any` exceptions

---

## Success Metrics

**After Phase 1** (Week 1):
- ✅ 0 lint warnings for floating promises
- ✅ Consistent error typing across codebase
- ✅ No console.* in production code (except logger internals)

**After Phase 2** (Week 2):
- ✅ 0 lint warnings for function length
- ✅ All components/hooks under 100 lines
- ✅ Better separation of concerns

**After Phase 3** (Sprint 2):
- ✅ Component coverage: 60%+
- ✅ Hook coverage: 80%+
- ✅ Overall coverage: 75%+

**After Phase 4** (Optional):
- ✅ Component coverage: 70%+
- ✅ Error boundaries in place
- ✅ Storage layer testable without filesystem

---

## Notes

1. **Parallelization**: Issues #1, #2, #3 can be done in parallel by different developers

2. **Testing First**: Consider TDD for refactoring (#4) - write tests before splitting components

3. **Code Review**: Each phase should be reviewed before moving to next

4. **Documentation**: Update CHANGELOG.md after each completed phase

5. **Rollback Plan**: Each phase should be a separate PR that can be reverted if needed

---

**Plan created**: January 9, 2026  
**Last updated**: January 9, 2026  
**Owner**: Development Team  
**Reviewer**: Tech Lead
