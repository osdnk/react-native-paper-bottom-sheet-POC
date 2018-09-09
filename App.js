import React, { Component } from 'react';
import { StyleSheet, View, Dimensions, ScrollView } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Appbar } from 'react-native-paper'
import Animated  from 'react-native-reanimated';
import { Surface } from 'react-native-paper';
import ListExample from './ListExample';
import ListAccExample from './ListAccExample';

const {height} = Dimensions.get('window');

const {
  set,
  cond,
  eq,
  greaterThan,
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
  defined,
  Value,
  Clock,
  event,
} = Animated;

function runSpring(clock, value, velocity, dest) {
  const state = {
    finished: new Value(0),
    velocity: new Value(0),
    position: new Value(0),
    time: new Value(0),
  };

  const config = {
    damping: 15,
    mass: 0.7,
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
  constructor(props) {
    super(props);

    const TOSS_SEC = 0.1;
   // const props.snapPoints = props.snapPoints.map(i => -i);
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


    const calledInCurrentBatch = new Value(0);
    this._transY = cond(
      eq(state, State.ACTIVE ),
      [
        stopClock(clock),
        set(transY, cond(lessThan(transY, props.snapPoints[0]), props.snapPoints[0], add(transY, sub(dragY, prevDragY)))),
        set(prevDragY, dragY),
        //call([transY], (x) => console.warn(x[0])),
        cond(lessThan(transY, props.snapPoints[0]), [
          cond(calledInCurrentBatch, 0, [
            set(calledInCurrentBatch, 1),
          ]),
          props.snapPoints[0]
        ], transY),
      ],
      [
        set(prevDragY, 0),
        set(
          transY,
          cond(and(defined(transY), greaterThan(transY, props.snapPoints[0])),
            runSpring(clock, transY, dragVY, snapPoint), props.snapPoints[0]
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
        <Animated.View style={[{ transform: [{ translateY: this._transY }] }, style]}>
          {renderHeader && renderHeader()}
          <ScrollView
            style={{
              width: '100%',
              height: '100%'
            }}
            scrollEnabled = {false}
            contentContainerStyle={style}>
          {children}
          </ScrollView>
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
    <View style = {{ width: '100%', height: 32, backgroundColor: '#6200ee' }}/>
  render() {
    return (
      <View style={styles.container}>
        <ListAccExample/>
        <BottomSheetBehaviour
          containerStyle={styles.innerContainer}
          snapPoints = {[0, 300, 500]}
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