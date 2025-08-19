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
  const selectedKorProvinces = selectedProvinces.length === 0
    ? []
    : provinceNames.filter(kor => selectedProvinces.includes(PROVINCE_MAP[kor]));

  // 시/군/구 합치기 (선택된 도가 없으면 빈 배열)
  const allCities = selectedKorProvinces.flatMap((kor) => REGION_MAP[kor] || []);

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
      <MultiToggleSelector
        items={provinceNames}
        selectedItems={
          selectedProvinceToggles.length === 0 ? [] : selectedProvinceToggles
        }
        onToggle={(next) => {
          // "선택없음"이면 전체 해제
          if (next.includes('선택없음') || next.length === 0) {
            onProvincesChange([]);
            onCitiesChange([]);
            return;
          }
          // 선택된 한글명을 코드로 변환
          const nextCodes = next.map(kor => PROVINCE_MAP[kor]).filter(Boolean);
          onProvincesChange(nextCodes);
          if (nextCodes.length === 0) onCitiesChange([]);
        }}
        size="large"
      />
      {selectedProvinces.length > 0 && allCities.length > 0 && (
        <MultiToggleSelector
          items={['선택없음', ...allCities.map(c => c.name)]}
          selectedItems={
            selectedCityToggles.length === 0 ? [] : selectedCityToggles
          }
          onToggle={(next) => {
            // "선택없음"이면 전체 해제
            if (next.includes('선택없음') || next.length === 0) {
              onCitiesChange([]);
              return;
            }
            // 한글명을 code로 변환
            const nextCodes = next.map(name => {
              const city = allCities.find(c => c.name === name);
              return city?.code;
            }).filter(Boolean);
            onCitiesChange(nextCodes);
          }}
          size="small"
        />
      )}
    </>
  );
}
