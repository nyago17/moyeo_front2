import React from 'react';
import { REGION_MAP, PROVINCE_MAP } from '../../common/regionMap';
import MultiToggleSelector from './MultiToggleSelector';

export default function MultiRegionSelector({
  selectedProvinces = [],
  selectedCities = [],
  onProvincesChange,
  onCitiesChange,
}) {
  const removedProvinces = ['부산', '대구', '인천', '광주', '대전', '울산', '세종'];
  const provinceNames = ['선택없음', ...Object.keys(REGION_MAP).filter(p => !removedProvinces.includes(p))];

  // 한글로 변환: ['선택없음'] 또는 [kor, kor, ...]
  const selectedKorProvinces = 
    selectedProvinces.length === 0
      ? []
      : provinceNames.filter(kor => selectedProvinces.includes(PROVINCE_MAP[kor])).slice(0,1);

  // 시/군/구 : 단일 도만 기준으로 목록 생성
  const activeProvinceKor = selectedKorProvinces[0];
  const allCities = activeProvinceKor ? (REGION_MAP[activeProvinceKor] || []) : []; 

  // "도" 토글 관리: 한글배열로 관리!
  const selectedProvinceToggles = selectedProvinces.length === 0
    ? []
    : provinceNames.filter(kor => selectedProvinces.includes(PROVINCE_MAP[kor]));

  // "시" 토글 관리: 한글배열로 관리!
  const selectedCityToggles = selectedCities.length === 0
    ? []
    : allCities.map(c => selectedCities.includes(c.code) ? c.name : null).filter(Boolean);

  return (
    <>
      {/* 도: 보이는 UI는 멀티처럼 보여도 내부 로직은 '단일'만 유지 */}
      <MultiToggleSelector
        items={provinceNames}
        selectedItems={
          selectedProvinceToggles.length === 0 ? [] : selectedProvinceToggles
        }
        onToggle={(next) => {
          // "선택없음"이면 전체 해제
          if (next.includes('선택없음') || next.length === 0) {
            onProvincesChange([]);  // 도 해제
            onCitiesChange([]);     // 시 초기화
            return;
          }
          // 선택된 한글명을 코드로 변환
          const nextCodesAll = next.map(kor => PROVINCE_MAP[kor]).filter(Boolean);
          // ★ 단일 선택 강제: 마지막으로 누른 도만 유지
          const lastKor = next[next.length - 1];                      // 마지막 클릭 항목
          const lastCode = PROVINCE_MAP[lastKor];                     // 코드 변환
          const nextCodesSingle = lastCode ? [lastCode] : [];         // 단일화
          onProvincesChange(nextCodesSingle);                         // 단일 코드만 반영
          onCitiesChange([]);                                         // 도 변경 시 시 초기화 (중요)
        }}
        size="large"
      />

      {/* 도가 선택되어 있을 때, 해당 도의 시만 노출 */}
      {selectedProvinces.length > 0 && allCities.length > 0 && (
        <MultiToggleSelector
          items={['선택없음', ...allCities.map(c => c.name)]}
          selectedItems={selectedCityToggles.length === 0 ? [] : selectedCityToggles}
          onToggle={(next) => {
            // "선택없음"이면 전체 해제
            if (next.includes('선택없음') || next.length === 0) {
              onCitiesChange([]); // 시 전체 해제
              return;
            }
            // 한글명을 code로 변환 (현재 단일 도의 시만 매핑)
            const nextCodes = next
              .map(name => {
                const city = allCities.find(c => c.name === name);
                return city?.code;
              })
              .filter(Boolean);
            onCitiesChange(nextCodes); // 다중 선택 허용
          }}
          size="small"
        />
      )}
    </>
  );
}
