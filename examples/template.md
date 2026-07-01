<style>
@page {
  size: A4;
  margin: 0;
}

body {
  margin: 0;
  background: #e5e5e5;
  font-family: Arial, sans-serif;
}

.page {
  width: 210mm;
  height: 297mm;
  box-sizing: border-box;
  position: relative;
  margin: 12mm auto;
  background: white;
  border: 1px solid #ccc;
  box-shadow: 0 2px 8px rgba(0,0,0,.15);
}

.header {
  position: absolute;
  top: 15mm;
  left: 20mm;
  right: 20mm;
  height: 12mm;
  border-bottom: 1px solid #777;
  font-size: 12px;
  font-weight: bold;
  color: #333;
}

.content {
  position: absolute;
  top: 35mm;
  left: 20mm;
  right: 20mm;
  bottom: 25mm;
  overflow: hidden;
  font-size: 14px;
  line-height: 1.55;
}

.footer {
  position: absolute;
  left: 20mm;
  right: 20mm;
  bottom: 10mm;
  display: flex;
  justify-content: space-between;
  font-size: 11px;
  color: #333;
}

.page-break {
  break-after: page;
  page-break-after: always;
}

@media print {
  body {
    background: white;
  }

  .page {
    margin: 0;
    border: none;
    box-shadow: none;
  }
}
</style>

<div class="page">

<div class="header">MONAS TECHNICAL MANUAL</div>

<div class="content">

# 1. NPSH 개요

NPSH는 펌프 흡입 조건을 판단할 때 사용하는 중요한 개념이다.

$$
NPSH_a=
\frac{P_{abs}}{\rho g}
+\frac{V^2}{2g}
+Z-h_f
-\frac{P_v}{\rho g}
$$

## 주요 변수

- $P_{abs}$ : 흡입측 절대압력
- $Z$ : 정수두
- $h_f$ : 흡입배관 손실
- $P_v$ : 증기압

</div>

<div class="footer">
  <span>1 / 3</span>
  <span>NPSH Manual</span>
  <span>REV. A</span>
</div>

</div>

<div class="page-break"></div>

<div class="page">

<div class="header">MONAS TECHNICAL MANUAL</div>

<div class="content">

# 2. NPSHa와 NPSHr

NPSHa는 현장 배관 조건에서 실제로 확보 가능한 유효흡입수두이다.

NPSHr은 펌프 제조사가 제시하는 필요유효흡입수두이다.

| 구분 | 의미 |
|---|---|
| NPSHa | Available NPSH |
| NPSHr | Required NPSH |
| 기준 | NPSHa > NPSHr |

## 설계 시 주의점

흡입 배관 손실이 커지면 NPSHa는 감소한다. 따라서 흡입 배관은 가능한 짧고 단순하게 구성하는 것이 유리하다.

</div>

<div class="footer">
  <span>2 / 3</span>
  <span>NPSH Manual</span>
  <span>REV. A</span>
</div>

</div>

<div class="page-break"></div>

<div class="page">

<div class="header">MONAS TECHNICAL MANUAL</div>

<div class="content">

# 3. 설계 검토 예시

아래 조건을 기준으로 흡입 조건을 검토한다.

- 흡입측 절대압력 증가 → NPSHa 증가
- 배관 손실 증가 → NPSHa 감소
- 증기압 증가 → NPSHa 감소

## 결론

펌프 선정 시에는 반드시 다음 관계를 만족해야 한다.

$$
NPSH_a > NPSH_r
$$

여유율을 고려하면 실제 설계에서는 단순히 같게 맞추는 것이 아니라 충분한 차이를 확보하는 것이 좋다.

</div>

<div class="footer">
  <span>3 / 3</span>
  <span>NPSH Manual</span>
  <span>REV. A</span>
</div>

</div>