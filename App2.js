import React, { Component } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import { NativeViewGestureHandler, PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import ListExample from './ListExample';
import ListAccExample from './ListAccExample';

const { height } = Dimensions.get('window');

const {
  set,
  cond,
  eq,
  greaterThan,
  add,
  onChange,
  multiply,
  or,
  block,
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
  neq,
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
      middlesOfSnapPoints.push(divide(add(props.snapPoints[i - 1] + props.snapPoints[i]), 2));
    }


    this._dragY = new Value(0);
    this.dragY = new Value(0);
    const state = new Value(-1);
    const dragVY = new Value(0);

    this._onGestureEvent = event([
      { nativeEvent: { translationY: this._dragY, velocityY: dragVY, state: state } },
    ]);

    this._onGestureEventHeader = event([
      { nativeEvent: { translationY: this.dragY, velocityY: dragVY, state: state } },
    ]);

    const transY = new Value();
    const prevDragY = new Value(0);

    const clock = new Clock();
    const destPoint = add(transY, multiply(TOSS_SEC, dragVY));


    const prepareCurrentSnapPoint = (i = 0) => i + 1 === props.snapPoints.length ?
      props.snapPoints[i] :
      cond(
        lessThan(destPoint, middlesOfSnapPoints[i]),
        props.snapPoints[i],
        prepareCurrentSnapPoint(i + 1)
      );


    this.snapPoint = prepareCurrentSnapPoint();


    const calledInCurrentBatch = new Value(0);
    this._transY = cond(
      eq(state, State.ACTIVE),
      [
        stopClock(clock),
        set(transY, cond(lessThan(transY, props.snapPoints[0]), props.snapPoints[0], add(transY, sub(this.dragY, prevDragY)))),
        set(prevDragY, this.dragY),
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
            runSpring(clock, transY, dragVY, this.snapPoint), props.snapPoints[0]
          )
        ),
      ]
    );
    this.state = {
      isScrollingContent: true
    }
  }

  initialY = new Value(0);

  _onRegisterLastScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: this.initialY } } }]
  );





  scrollViewRef = React.createRef();
  scrollViewComponentRef = React.createRef();
  mainPanRef = React.createRef();
  startSnapPoint = new Value(0); // not sure
  //isScrollingContent = new Value(0);





  render() {
    console.log(this.scrollViewComponentRef)
    const { children, containerStyle: style, renderHeader, ...rest } = this.props;
    return (
        <Animated.View style={[{ transform: [{ translateY: this._transY }] }, style]}>
          <PanGestureHandler
            {...rest}
            maxPointers={1}
            ref={this.mainPanRef}
            onGestureEvent={this._onGestureEventHeader}
            onHandlerStateChange={this._onGestureEventHeader}
            simultaneousHandlers={this.scrollViewRef}
          >
            <Animated.View
              style={{width: '100%', height: '100%'}}
            >
            {renderHeader && renderHeader()}
            </Animated.View>
          </PanGestureHandler>
          <Animated.Code>
            {() => block(
              [
                onChange(this.hasEndedDragging, [set(this.initialY, 0), call([this.snapPoint], this.onScrollingEnded)]),
             //   cond(greaterThan(this._dragY, this.initialY), set(this.isScrollingContent, 1)),

                set(this.dragY, cond(greaterThan(this._dragY, this.initialY), sub(this._dragY, this.initialY), 0))
              ])
            }
          </Animated.Code>
          <PanGestureHandler
            {...rest}
            maxPointers={1}
            ref={this.mainPanRef}
            onGestureEvent={this._onGestureEvent}
            onHandlerStateChange={this._onGestureEvent}
            simultaneousHandlers={this.scrollViewRef}
          >
            <Animated.View
              style={{width: '100%', height: 300}}
            >
            <NativeViewGestureHandler
              ref={this.scrollViewRef}
            >
              <Animated.ScrollView
                ref = {this.scrollViewComponentRef}
                style={{
                  width: '100%',
                  height: '100%'
                }}
                bounces={false}
                scrollEnabled={this.state.isScrollingContent}
                onScrollEndDrag={this._onRegisterEnd}
                onScrollBeginDrag={this._onRegisterLastScroll}
                contentContainerStyle={style}>
                {children}
              </Animated.ScrollView>
            </NativeViewGestureHandler>
            </Animated.View>
          </PanGestureHandler>
        </Animated.View>
    );
  }
}

export default class Example extends Component {
  static navigationOptions = {
    title: 'BottomSheetBehaviour Example',
  };
  _renderHeader = () =>
    <View style={{ width: '100%', height: 64, backgroundColor: '#6200ee' }}/>;

  render() {
    return (
      <View style={styles.container}>
        <ListAccExample/>
        <BottomSheetBehaviour
          containerStyle={styles.innerContainer}
          snapPoints={[0, 300, 500]}
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