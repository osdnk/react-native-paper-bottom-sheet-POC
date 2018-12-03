import React, { Component } from 'react';
import { StyleSheet, View, Dimensions, ScrollView } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated, { Easing }  from 'react-native-reanimated';
import ListExample from './ListExample';
import ListAccExample from './ListAccExample';

const {height} = Dimensions.get('window');

const {
  set,
  cond,
  eq,
  greaterThan,
  timing,
  add,
  onChange,
  multiply,
  spring,
  startClock,
  and,
  call,
  divide,
  stopClock,
  clockRunning,
  sub,
  lessThan,
  block,
  defined,
  Value,
  Clock,
  event,
} = Animated;

function runSpring(clock, value, velocity, dest, position = new Value(0)) {
  const state = {
    finished: new Value(0),
    velocity: new Value(0),
    position,
    time: new Value(0),
  };

  const config = {
    damping: 20,
    mass: 0.4,
    stiffness: 221.6,
    overshootClamping: false,
    restSpeedThreshold: 0.001,
    restDisplacementThreshold: 0.001,
    toValue: new Value(0),
  };

  return [
    cond(clockRunning(clock), 0, [
      set(state.finished, 0),
      set(state.velocity, velocity),
      set(state.position, value),
      set(config.toValue, dest),
      startClock(clock),
    ]),
    spring(clock, state, config),
    cond(state.finished, stopClock(clock)),
    state.position,
  ];
}

class BottomSheetBehaviour extends Component {
  height = new Value(0);
  constructor(props) {
    super(props);
    this.onLayout = event => this.height.setValue(event.nativeEvent.layout.height - height);

    const TOSS_SEC = 0.001;
    const middlesOfSnapPoints = [];
    for (let i = 1; i < props.snapPoints.length; i++) {
      middlesOfSnapPoints.push(divide(add(props.snapPoints[i-1] + props.snapPoints[i]), 2))
    }

    const dragY = new Value(0);
    const state = new Value(-1);
    const dragVY = new Value(0);

    this._onGestureEvent = event([
      { nativeEvent: { translationY: dragY, velocityY: dragVY, state: state } },
    ]);

    const transY = new Value();
    const prevDragY = new Value(0);

    const clock = new Clock();
    const destPoint = add(transY, multiply(TOSS_SEC, dragVY))


    const prepareCurrentSnapPoint = (i = 0) => i + 1 === props.snapPoints.length ?
      props.snapPoints[i] :
      cond(
        lessThan(destPoint, middlesOfSnapPoints[i]),
        props.snapPoints[i],
        prepareCurrentSnapPoint(i + 1)
      );

    const snapPoint = prepareCurrentSnapPoint();

    const unMargined = new Value(0);

    this._transY = cond(
      eq(state, State.ACTIVE ),
      [
        stopClock(clock),

        set(transY,
          cond(greaterThan(multiply(-1, add(transY, sub(dragY, prevDragY))), this.height),
            multiply(this.height, -1),
            add(transY, sub(dragY, prevDragY)),
          ),
        ),
        set(prevDragY, dragY),
        transY,
      ],
      [
        set(prevDragY, 0),
        set(
          transY,
          cond(defined(transY),
              [
              runSpring(clock, transY, dragVY, cond(greaterThan(transY, props.snapPoints[0]), snapPoint, add(transY, multiply(0.2, dragVY))), unMargined),
                cond(greaterThan(multiply(-1, unMargined), this.height),
                  multiply(this.height, -1),
                  unMargined
                ),
           ],
            props.snapPoints[0]
          )
        ),
      ]
    );
  }
  render() {
    const { children, containerStyle: style, renderHeader, ...rest } = this.props;
    return (
      <PanGestureHandler
        {...rest}
        maxPointers={1}
        onGestureEvent={this._onGestureEvent}
        onHandlerStateChange={this._onGestureEvent}>
        <Animated.View
          style={{ width: '100%', position: 'absolute', overflow: 'hidden',
          transform: [{
            translateY: cond(greaterThan(this._transY, this.props.snapPoints[0]), this._transY, this.props.snapPoints[0])
          }]
        }}
        >
          <Animated.View
            style={{
              zIndex: 1,
            }}
          >
            {renderHeader && renderHeader()}
          </Animated.View>
          <Animated.View
            onLayout={this.onLayout}
            style={{
              transform: [{
                translateY: cond(greaterThan(this._transY, this.props.snapPoints[0]), 0, sub(this._transY, this.props.snapPoints[0]))
              }],
              height: '100%',
            }}
          >
          {children}
          </Animated.View>
        </Animated.View>
      </PanGestureHandler>
    );
  }
}

export default class Example extends Component {
  static navigationOptions = {
    title: 'BottomSheetBehaviour Example',
  };
  _renderHeader = () =>
    <View style = {{ height: 32, backgroundColor: '#6200ee' }}/>
  render() {
    return (
      <View style={styles.container}
      >
        <ListAccExample/>
        <BottomSheetBehaviour
          containerStyle={styles.innerContainer}
          snapPoints = {[100, 300, 500]}
          renderHeader={this._renderHeader}
        >
          <ListExample/>
        </BottomSheetBehaviour>
      </View>
    );
  }
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5FCFF',
  },
  innerContainer: {
    position: 'absolute',
    width: '100%',
    height,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5FCFF',
  }
});
