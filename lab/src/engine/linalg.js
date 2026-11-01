// Small dense matrices as arrays of rows. Sizes here are 3x3, so clarity beats speed.

export const zeros = (n, m = n) => Array.from({ length: n }, () => new Array(m).fill(0));
export const diag = (v) => v.map((x, i) => v.map((_, j) => (i === j ? x : 0)));

export function matMul(A, B) {
  const n = A.length, m = B[0].length, k = B.length;
  const C = zeros(n, m);
  for (let i = 0; i < n; i++) for (let j = 0; j < m; j++) {
    let s = 0;
    for (let l = 0; l < k; l++) s += A[i][l] * B[l][j];
    C[i][j] = s;
  }
  return C;
}

export function inverse(A) {
  const n = A.length;
  const M = A.map((r, i) => [...r, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
  for (let c = 0; c < n; c++) {
    let p = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r;
    if (Math.abs(M[p][c]) < 1e-14) throw new Error("singular matrix");
    [M[c], M[p]] = [M[p], M[c]];
    const d = M[c][c];
    for (let j = 0; j < 2 * n; j++) M[c][j] /= d;
    for (let r = 0; r < n; r++) if (r !== c) {
      const f = M[r][c];
      if (f !== 0) for (let j = 0; j < 2 * n; j++) M[r][j] -= f * M[c][j];
    }
  }
  return M.map((r) => r.slice(n));
}

export function cholesky(A) {
  const n = A.length;
  const L = zeros(n);
  for (let i = 0; i < n; i++) for (let j = 0; j <= i; j++) {
    let s = A[i][j];
    for (let k = 0; k < j; k++) s -= L[i][k] * L[j][k];
    if (i === j) {
      if (s <= 0) throw new Error("matrix not positive definite");
      L[i][j] = Math.sqrt(s);
    } else L[i][j] = s / L[j][j];
  }
  return L;
}
