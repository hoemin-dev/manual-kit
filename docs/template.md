
<div class="page">

<div class="header">
MANUAL KIT
</div>

<div class="content">

# 1. Introduction

이 문서는 **Markdown + HTML**을 이용한 A4 매뉴얼 템플릿입니다.

---

## 1.1 Paragraph

일반 문단입니다.

Markdown 문법을 그대로 사용할 수 있습니다.

> Blockquote(참고사항) 예제입니다.
>
> CSS에서 blockquote만 꾸며주면 됩니다.

---

## 1.2 List

- Item A
- Item B
- Item C

1. First
2. Second
3. Third

---

## 1.3 Table

| Item | Description |
|------|-------------|
| A | Apple |
| B | Banana |
| C | Cherry |

---

</div>

<div class="footer">
<span class="page-no"></span>
<span>Manual Kit</span>
<span>REV. A</span>
</div>

</div>

<div class="page-break"></div>

<div class="page">

<div class="header">
MANUAL KIT
</div>

<div class="content">

<table class="tbl" data-src="../assets/tbl/npsh.tbl"></table>

## 1.4 Formula

$$
NPSH_a =
\frac{P_{abs}}{\rho g}
+
\frac{V^2}{2g}
+
Z
-
h_f
-
\frac{P_v}{\rho g}
$$
..


# 2. Code Example

JavaScript

```javascript
const pages = document.querySelectorAll(".page");

pages.forEach((page, index) => {
    console.log(index + 1);
});
```

---

HTML

```html
<div class="page">

<div class="header"></div>

<div class="content"></div>

<div class="footer"></div>

</div>
```

---

CSS

```css
.page{
    width:210mm;
    height:297mm;
}
```

</div>

<div class="footer">
<span class="page-no"></span>
<span>Manual Kit</span>
<span>REV. A</span>
</div>

</div>

<div class="page-break"></div>

<div class="page">

<div class="header">
MANUAL KIT
</div>

<div class="content">

# 3. Conclusion

이 템플릿은

- Markdown
- HTML
- CSS
- JavaScript

만으로 A4 기술문서를 작성하기 위한 기본 구조입니다.

HTML은 **레이아웃**만 담당하고,

Markdown은 **내용**만 담당합니다.

</div>

<div class="footer">
<span class="page-no"></span>
<span>Manual Kit</span>
<span>REV. A</span>
</div>

</div>