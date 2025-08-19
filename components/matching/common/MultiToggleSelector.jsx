import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

// 💡 기본 ToggleSelector 스타일을 그대로 참고해서 멀티 선택 전용으로 만듦
export default function MultiToggleSelector({
  items = [],
  selectedItems = [],
  onToggle,
  size = 'large',
}) {
  // "선택없음" 선택 여부 확인
  const noneSelected = selectedItems.includes('선택없음');

  const handlePress = (item) => {
    // "선택없음" 클릭
    if (item === '선택없음') {
      if (noneSelected) {
        // 이미 선택 → 해제 (전체 해제)
        onToggle([]);
      } else {
        // "선택없음"만 선택
        onToggle(['선택없음']);
      }
      return;
    }
    // 다른 항목 클릭
    let next;
    if (selectedItems.includes(item)) {
      next = selectedItems.filter((v) => v !== item);
    } else {
      next = [...selectedItems.filter((v) => v !== '선택없음'), item];
    }
    onToggle(next);
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollView}>
      {items.map((item) => {
        const isSelected = selectedItems.includes(item);
        const isDisabled =
          noneSelected && item !== '선택없음'; // "선택없음" 선택시 나머지 모두 disabled

        return (
          <TouchableOpacity
            key={item}
            onPress={() => handlePress(item)}
            style={[
              styles.toggle,
              size === 'small'
                ? styles.small
                : size === 'middle'
                ? styles.middle
                : styles.large,
              isSelected && styles.selectedToggle,
              isDisabled && styles.disabledToggle,
            ]}
            activeOpacity={0.7}
            disabled={isDisabled}
          >
            <Text
              style={[
                styles.toggleText,
                size === 'small'
                  ? styles.smallText
                  : size === 'middle'
                  ? styles.middleText
                  : styles.largeText,
                isSelected && styles.selectedText,
                isDisabled && styles.disabledText,
                isDisabled && { color: '#B3B3B3' }
              ]}
            >
              {item}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    marginTop: 8,
    paddingLeft: 1,
  },
  toggle: {
    borderWidth: 1,
    borderColor: '#726BEA',
    backgroundColor: '#FFFFFF',
    marginRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedToggle: {
    backgroundColor: '#B3A4F7',
    borderColor: '#726BEA',
  },
  large: {
    width: 95,
    height: 40,
    borderRadius: 12,
  },
  small: {
    width: 76,
    height: 32,
    borderRadius: 12,
  },
  middle: {
    width: 95,
    height: 40,
    borderRadius: 12,
  },
  toggleText: {
    fontFamily: 'Roboto',
    color: '#373737',
    fontWeight: '400',
  },
  largeText: {
    fontSize: 14,
  },
  smallText: {
    fontSize: 12,
  },
  middleText: {
    fontSize: 14,
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  disabledToggle: {
    backgroundColor: '#F5F4FA',
    borderColor: '#DDD9F5',
    opacity: 0.65,
  },
  disabledText: {
    color: '#B3B3B3',
  },
});
