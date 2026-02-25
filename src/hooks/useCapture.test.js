import { renderHook, act } from '@testing-library/react';
import useCapture from './useCapture';

describe('useCapture', () => {
  it('starts with empty gallery', () => {
    const { result } = renderHook(() => useCapture());
    expect(result.current.photos).toEqual([]);
  });

  it('adds a photo to gallery', () => {
    const { result } = renderHook(() => useCapture());
    act(() => result.current.addPhoto('data:image/jpeg;base64,abc'));
    expect(result.current.photos).toHaveLength(1);
    expect(result.current.photos[0].dataUrl).toBe('data:image/jpeg;base64,abc');
    expect(result.current.photos[0].timestamp).toBeDefined();
  });

  it('caps gallery at 20 photos, dropping oldest', () => {
    const { result } = renderHook(() => useCapture());
    act(() => {
      for (let i = 0; i < 25; i++) {
        result.current.addPhoto(`data:image/jpeg;base64,${i}`);
      }
    });
    expect(result.current.photos).toHaveLength(20);
    // Oldest (0-4) should be gone, newest (5-24) remain
    expect(result.current.photos[0].dataUrl).toBe('data:image/jpeg;base64,5');
  });

  it('clears all photos', () => {
    const { result } = renderHook(() => useCapture());
    act(() => result.current.addPhoto('data:image/jpeg;base64,abc'));
    act(() => result.current.clearPhotos());
    expect(result.current.photos).toEqual([]);
  });
});
