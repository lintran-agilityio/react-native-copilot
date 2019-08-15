// @flow
import React, { Component } from 'react';
import {
  View,
  Animated,
  Easing,
  Dimensions,
  Platform
} from 'react-native';
// import { Svg } from 'expo';
import Svg from 'react-native-svg';
import AnimatedSvgPath from './AnimatedPath';

import type { valueXY } from '../types';

const windowDimensions = Dimensions.get('window');
const path = (size, position, canvasSize): string => `M0,0H${canvasSize.x}V${canvasSize.y}H0V0ZM${position.x._value},${position.y._value}H${position.x._value + size.x._value}V${position.y._value + size.y._value}H${position.x._value}V${position.y._value}Z`;
const screenWidth = windowDimensions.width
const screenHeight = windowDimensions.height

type Props = {
  size: valueXY,
  position: valueXY,
  style: object | number | Array,
  easing: func,
  animationDuration: number,
  animated: boolean,
  backdropColor: string,
};

type State = {
  size: Animated.ValueXY,
  position: Animated.ValueXY,
  canvasSize: ?valueXY,
};

class SvgMask extends Component<Props, State> {
  static defaultProps = {
    animationDuration: 300,
    easing: Easing.linear,
  };

  constructor(props) {
    super(props);

    this.state = {
      canvasSize: {
        x: screenWidth,
        y: screenHeight,
      },
      size: new Animated.ValueXY({ ...props.size, x: screenWidth / 2 }),
      position: new Animated.ValueXY(props.position),
    };

    this.state.position.addListener(this.animationListener);
    this.isAndroid = Platform.OS === 'android'
  }

  componentWillReceiveProps(nextProps) {
    const { size, screen, position, currentStepNumber } = nextProps

    // Check tab at ProgramDetail screen
    const isTabProgramAtDetail = screen === 'ProgramDetailScreen' && size.y === 5
    const offsetAnrdoid = this.isAndroid && screen === 'DiscoverScreen' && currentStepNumber === 3
        ? 16
        : this.isAndroid && screen !== 'WorkoutVideoDetailScreen'
        ? 27
        : 0
    const offsetAnrdoidX = this.isAndroid && screen === 'PlanProgressScreen' ? -20 : 0
    const positionY = (isTabProgramAtDetail ? position.y + 7 : position.y) + offsetAnrdoid

    // Check tab at DiscoverScreen
    const isTabProgramAtHome = screen === 'DiscoverScreen' && currentStepNumber === 1
    const isTabDiscoverAtHome = screen === 'DiscoverScreen' && currentStepNumber === 2

    // Hidden View with height === 4 (real style is 0)
    const isHidenHighlight = size.y === 4
    const y = isTabProgramAtDetail || isTabProgramAtHome || isTabDiscoverAtHome
        ? 50
        : isHidenHighlight
        ? 0
        : size.y
    const x = isTabProgramAtHome || isTabDiscoverAtHome
        ? screenWidth / 2
        : size.x
    const positionX = (isTabDiscoverAtHome ? screenWidth / 2 : position.x) + offsetAnrdoidX
    if (
      this.props.position !== nextProps.position ||
      this.props.size !== nextProps.size
    ) {
      this.animate({ x, y }, { x: positionX, y: positionY })
    }
  }

  animationListener = (): void => {
    const d: string = path(this.state.size, this.state.position, this.state.canvasSize);
    if (this.mask) {
      this.mask.setNativeProps({ d });
    }
  };

  animate = (size: valueXY = this.props.size, position: valueXY = this.props.position): void => {
    if (this.props.animated) {
      Animated.parallel([
        Animated.timing(this.state.size, {
          toValue: size,
          duration: this.props.animationDuration,
          easing: this.props.easing,
        }),
        Animated.timing(this.state.position, {
          toValue: position,
          duration: this.props.animationDuration,
          easing: this.props.easing,
        }),
      ]).start();
    } else {
      this.state.size.setValue(size);
      this.state.position.setValue(position);
    }
  }

  handleLayout = ({ nativeEvent: { layout: { width, height } } }) => {
    this.setState({
      canvasSize: {
        x: width,
        y: height,
      },
    });
  }

  render() {
    return (
      <View pointerEvents="box-none" style={this.props.style} onLayout={this.handleLayout}>
        {
          this.state.canvasSize
            ? (
              <Svg pointerEvents="none" width={this.state.canvasSize.x} height={this.state.canvasSize.y}>
                <AnimatedSvgPath
                  ref={(ref) => { this.mask = ref; }}
                  fill={this.props.backdropColor}
                  fillRule="evenodd"
                  strokeWidth={1}
                  d={path(this.state.size, this.state.position, this.state.canvasSize)}
                />
              </Svg>
            )
            : null
        }
      </View>
    );
  }
}

export default SvgMask;
