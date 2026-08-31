(function () {
  const detailPanel = document.getElementById("detail-panel");
  const zones = document.querySelectorAll(".zone");

  function fieldRow(label, field) {
    if (!field) return "";
    const verified = field.verified;
    const tag = `<span class="tag-verified ${verified ? "yes" : "no"}">${verified ? "확인됨" : "확인 필요"}</span>`;
    let valueHtml;
    if (Array.isArray(field.value)) {
      valueHtml = field.value.length
        ? field.value.map((v) => (typeof v === "string" ? v : v.name)).join(", ")
        : "<em>데이터 없음</em>";
    } else {
      valueHtml = field.value ?? "<em>데이터 없음</em>";
    }
    const sourceHtml = field.source
      ? `<div class="source-link">출처: ${
          /^https?:\/\//.test(field.source)
            ? `<a href="${field.source}" target="_blank" rel="noopener">${field.source}</a>`
            : field.source
        }</div>`
      : "";
    return `
      <div class="field">
        <div class="field-label">${label} ${tag}</div>
        <div class="field-value">${valueHtml}</div>
        ${sourceHtml}
      </div>`;
  }

  function renderZone(zoneId) {
    const zone = WIRYE_ZONES.find((z) => z.id === zoneId);
    if (!zone) {
      detailPanel.innerHTML = `<p class="placeholder">데이터를 찾을 수 없습니다.</p>`;
      return;
    }

    const transitHtml = zone.transitPlans.length
      ? zone.transitPlans
          .map(
            (t) => `
        <div class="field">
          <div class="field-label">${t.name} <span class="tag-verified ${t.verified ? "yes" : "no"}">${t.verified ? "확인됨" : "확인 필요"}</span></div>
          <div class="field-value">${t.stage}<br/><small>${t.note}</small></div>
          <div class="source-link">출처: <a href="${t.source}" target="_blank" rel="noopener">${t.source}</a></div>
        </div>`
          )
          .join("")
      : `<div class="field"><div class="field-label">교통호재</div><div class="field-value"><em>등록된 호재 정보 없음 (확인 필요)</em></div></div>`;

    detailPanel.innerHTML = `
      <div class="detail-card">
        <h3>${zone.name}</h3>
        <p class="field-value">${zone.region}</p>
        ${fieldRow("개발 현황", zone.status)}
        ${fieldRow("초등학교(초품아)", zone.elementarySchools)}
        ${fieldRow("중학교", zone.middleSchools)}
        ${fieldRow("고등학교 / 자사고 여부", zone.highSchools)}
        ${fieldRow("SKY·의대 진학 (근거 필요)", zone.skyMedicalAdmits)}
        ${fieldRow("대장아파트", zone.flagshipApartment)}
        ${fieldRow("실거래가 출처", zone.transactionPriceSource)}
        ${transitHtml}
        ${fieldRow("역까지 도보시간", zone.walkTimeToStation)}
      </div>
    `;
  }

  zones.forEach((zoneEl) => {
    zoneEl.addEventListener("click", () => {
      zones.forEach((z) => z.classList.remove("selected"));
      zoneEl.classList.add("selected");
      renderZone(zoneEl.dataset.id);
    });
  });

  // filter chips: 목업 단계에서는 시각적 토글만 수행
  document.querySelectorAll(".chip").forEach((chip) => {
    chip.addEventListener("click", () => chip.classList.toggle("active"));
  });

  const modal = document.getElementById("modal-backdrop");
  document.getElementById("open-message-modal").addEventListener("click", () => {
    modal.classList.add("open");
  });
  document.getElementById("modal-close").addEventListener("click", () => {
    modal.classList.remove("open");
  });
  document.getElementById("modal-pay-mock").addEventListener("click", () => {
    alert("목업입니다. 실제 결제는 카카오페이 가맹점 심사/전자상거래법 요건 충족 후 연동해야 합니다.");
  });
})();
