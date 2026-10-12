describe("AI Service Vector Similarity Calculations", () => {
  // Test mathematical cosine similarity logic
  function cosineSimilarity(a: number[], b: number[]): number {
    const dotProduct = a.reduce((sum, val, i) => sum + val * (b[i] || 0), 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
    return magnitudeA && magnitudeB ? dotProduct / (magnitudeA * magnitudeB) : 0;
  }

  test("identical vectors have a cosine similarity of 1.0", () => {
    const vecA = [0.2, 0.5, 0.8];
    const vecB = [0.2, 0.5, 0.8];
    const similarity = cosineSimilarity(vecA, vecB);
    expect(similarity).toBeCloseTo(1.0, 5);
  });

  test("orthogonal vectors have a cosine similarity of 0.0", () => {
    const vecA = [1, 0, 0];
    const vecB = [0, 1, 0];
    const similarity = cosineSimilarity(vecA, vecB);
    expect(similarity).toBe(0.0);
  });

  test("opposite vectors have a cosine similarity of -1.0", () => {
    const vecA = [1, 0, 0];
    const vecB = [-1, 0, 0];
    const similarity = cosineSimilarity(vecA, vecB);
    expect(similarity).toBeCloseTo(-1.0, 5);
  });

  test("arbitrary vectors return expected normalized similarity score", () => {
    const vecA = [1, 2, 3];
    const vecB = [4, 5, 6];
    // dot = 4 + 10 + 18 = 32
    // magA = sqrt(1+4+9) = sqrt(14)
    // magB = sqrt(16+25+36) = sqrt(77)
    // expected = 32 / sqrt(14*77) = 32 / sqrt(1078) = 0.97463
    const similarity = cosineSimilarity(vecA, vecB);
    expect(similarity).toBeGreaterThan(0.97);
    expect(similarity).toBeLessThan(0.98);
  });
});
