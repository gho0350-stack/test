/**
 * 전국 지도(시/도 → 시/군/구) 드릴다운 + 커스텀 학군 영역(위례 등) 진입점.
 *
 * 데이터 출처/한계는 data/geo/SOURCE.md 참고.
 * 커스텀 영역 목록은 data/regions.js (CUSTOM_DISTRICTS).
 * 위례 상세 화면(구/신 영역별 카드)은 js/app.js가 그림 — 여기서는 화면 전환만 담당.
 */

(function () {
  const nationalView = document.getElementById("national-view");
  const districtView = document.getElementById("district-view");
  const statusEl = document.getElementById("national-status");
  const resetBtn = document.getElementById("reset-national");
  const backBtn = document.getElementById("back-to-national");

  const map = L.map("national-map", { zoomControl: true }).setView([36.2, 127.9], 7);

  let sidoLayer = null;
  let sigunguLayer = null;
  let districtMarkers = [];

  const starIcon = L.divIcon({
    className: "district-star-icon",
    html: "★",
    iconSize: [22, 22],
    iconAnchor: [11, 11]
  });

  function setStatus(text) {
    statusEl.textContent = text;
  }

  function showDistrictView(districtId) {
    // 지금은 위례만 실제 콘텐츠가 있음. 다른 id가 들어오면 안내만 표시.
    if (districtId !== "wirye") {
      alert("이 지역은 아직 상세 데이터가 없습니다. (준비 중)");
      return;
    }
    nationalView.hidden = true;
    districtView.hidden = false;
  }

  backBtn.addEventListener("click", () => {
    districtView.hidden = true;
    nationalView.hidden = false;
    map.invalidateSize();
  });

  function addDistrictMarkers() {
    districtMarkers.forEach((m) => map.removeLayer(m));
    districtMarkers = [];
    CUSTOM_DISTRICTS.forEach((d) => {
      const marker = L.marker([d.marker.lat, d.marker.lon], { icon: starIcon }).addTo(map);
      marker.bindTooltip(
        `${d.name}${d.marker.approx ? " (근사 위치)" : ""}`,
        { direction: "top" }
      );
      marker.on("click", () => showDistrictView(d.detailView));
      districtMarkers.push(marker);
    });
  }

  function sigunguStyle() {
    return { color: "#2f6fed", weight: 1, fillColor: "#e8f0fe", fillOpacity: 0.5 };
  }

  function sidoStyle() {
    return { color: "#2f6fed", weight: 1.5, fillColor: "#dbe7ff", fillOpacity: 0.35 };
  }

  function showSigunguForSido(sidoCode, sidoFeature) {
    if (sigunguLayer) map.removeLayer(sigunguLayer);
    map.removeLayer(sidoLayer);

    sigunguLayer = L.geoJSON(window.__sigunguGeo, {
      filter: (f) => f.properties.code.startsWith(sidoCode),
      style: sigunguStyle,
      onEachFeature: (feature, layer) => {
        layer.on("click", () => {
          const hit = CUSTOM_DISTRICTS.find((d) => d.sigunguCodes.includes(feature.properties.code));
          if (hit) {
            showDistrictView(hit.detailView);
          } else {
            setStatus(`${feature.properties.name}: 아직 상세 데이터 없음 (준비 중)`);
          }
        });
        layer.on("mouseover", () => layer.setStyle({ fillOpacity: 0.8 }));
        layer.on("mouseout", () => layer.setStyle({ fillOpacity: 0.5 }));
        layer.bindTooltip(feature.properties.name);
      }
    }).addTo(map);

    map.fitBounds(sigunguLayer.getBounds(), { padding: [20, 20] });
    setStatus(`${sidoFeature.properties.name} 내 시/군/구를 클릭해 보세요. (★ 표시 지역만 상세 콘텐츠 있음)`);
    resetBtn.hidden = false;
  }

  function resetToNational() {
    if (sigunguLayer) {
      map.removeLayer(sigunguLayer);
      sigunguLayer = null;
    }
    if (!map.hasLayer(sidoLayer)) sidoLayer.addTo(map);
    map.setView([36.2, 127.9], 7);
    setStatus("시/도를 클릭해 확대해 보세요.");
    resetBtn.hidden = true;
  }

  resetBtn.addEventListener("click", resetToNational);

  Promise.all([
    fetch("data/geo/sido.geojson").then((r) => r.json()),
    fetch("data/geo/sigungu.geojson").then((r) => r.json())
  ])
    .then(([sidoGeo, sigunguGeo]) => {
      window.__sigunguGeo = sigunguGeo;

      sidoLayer = L.geoJSON(sidoGeo, {
        style: sidoStyle,
        onEachFeature: (feature, layer) => {
          layer.on("click", () => showSigunguForSido(feature.properties.code, feature));
          layer.on("mouseover", () => layer.setStyle({ fillOpacity: 0.6 }));
          layer.on("mouseout", () => layer.setStyle({ fillOpacity: 0.35 }));
          layer.bindTooltip(feature.properties.name);
        }
      }).addTo(map);

      addDistrictMarkers();
      resetBtn.hidden = true;
      setStatus("시/도를 클릭해 확대해 보세요.");
    })
    .catch((err) => {
      setStatus("지도 데이터를 불러오지 못했습니다. 정적 서버로 열었는지 확인해 주세요.");
      console.error(err);
    });
})();
