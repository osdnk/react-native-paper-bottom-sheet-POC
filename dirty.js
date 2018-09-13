import React, { Component } from 'react';
import { Dimensions, StyleSheet, View, Platform } from 'react-native';
import { NativeViewGestureHandler, PanGestureHandler, State } from 'react-native-gesture-handler';
import Animated  from 'react-native-reanimated';
import ListExample from './ListExample';
import ListAccExample from './ListAccExample';
import { evaluateOnce } from 'react-native-reanimated/src/derived/evaluateOnce';

const { height } = Dimensions.get('window');

const {
  set,
  cond,
  eq,
  greaterThan,
  block,
  or,
  add,
  neq,
  onChange,
  multiply,
  spring,
  startClock,
  and,
  call,
  divide,
  stopClock,
  greaterOrEq,
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
      middlesOfSnapPoints.push(divide(add(props.snapPoints[i - 1] + props.snapPoints[i]), 2));
    }


    this.dragY = new Value(0);
    this.untraverdtedDragY = new Value(0);
    this.gstate = new Value(-1);
    const dragVY = new Value(0);

    this._onGestureEvent = event([
      { nativeEvent: { translationY: this.untraverdtedDragY, velocityY: dragVY, state: this.gstate } },
    ]);

    this._onGestureEventHeader = event([
      { nativeEvent: { translationY: this.dragY, velocityY: dragVY, state: this.gstate } },
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
      eq(this.gstate, State.ACTIVE),
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
    };
  }

  hasEndedDragging = new Value(0);

  onScrollingEnded = (v) => {
    console.log(v);
    console.log(v[0], this.props.snapPoints[0]);
    console.log(this.scrollViewComponentRef)
    this.setState({ isScrollingContent: v[0] === this.props.snapPoints[0] });
  };


  initialY = new Value(0);
  scrollViewRef = React.createRef();
  scrollViewComponentRef = React.createRef();
  mainPanRef = React.createRef();
  failable = React.createRef();


  _onRegisterEnd = Animated.event(
    [{ nativeEvent: { contentOffset: { y: this.hasEndedDragging } } }]
  );

  registerFirstTouch = Animated.event(
    [{ nativeEvent: { contentOffset: { y: this.initialY } } }]
  );

  stateIsScrollingContent = new Value(1); // to be sync with state
  render() {
    const { children, containerStyle: style, renderHeader, ...rest } = this.props;
    return (
      <Animated.View style={[{ transform: [{ translateY: this._transY }], height: '100%', width: '100%', position: 'absolute'}]}>
        <Animated.Code>
          {() => block(
            [
              set(this.dragY, cond(or(greaterThan(this.untraverdtedDragY, this.initialY), neq(this._transY, this.props.snapPoints[0])), sub(this.untraverdtedDragY, this.initialY), 0))
            ])
          }
        </Animated.Code>

        <Animated.Code>
          {() => block(
            [
              onChange(this.gstate, cond(eq(this.gstate, State.END),
                [set(this.initialY, 0),
                  set(this.untraverdtedDragY, 0),
                  set(this.stateIsScrollingContent, eq(this.props.snapPoints[0], this.snapPoint))
                ])),
            ])
          }
        </Animated.Code>

        <Animated.Code>
          {() => block(
            [
              onChange(this.stateIsScrollingContent, call([this.snapPoint], this.onScrollingEnded)),
              Platform.OS === 'android' && onChange(this._transY, call([], () => this.scrollViewComponentRef.current.getNode().scrollTo({ y: 0 })))
            ])
          }
        </Animated.Code>

        <Animated.Code>
          {() => block(
            [
              cond(greaterOrEq(this.props.snapPoints[0], this._transY), set(this.stateIsScrollingContent,1))
            ])
          }
        </Animated.Code>


        <PanGestureHandler
          {...rest}
          maxPointers={1}
          onGestureEvent={this._onGestureEventHeader}
          onHandlerStateChange={this._onGestureEventHeader}>
          <Animated.View>
            {renderHeader && renderHeader()}
          </Animated.View>
        </PanGestureHandler>
        <PanGestureHandler
          ref={this.mainPanRef}
          maxPointers={1}
          onGestureEvent={this._onGestureEvent}
          simultaneousHandlers={[this.scrollViewRef, this.failable] }
          //
          onHandlerStateChange={this._onGestureEvent}>
          <Animated.View style={{ flex: 1 }}>
            <PanGestureHandler
              maxDeltaY={10000}
              minDeltaY={10000}
              enabled={false}
              ref={this.failable}
            >
              <Animated.View style = {{ flex: 1 }}
              >
                <NativeViewGestureHandler
                  ref={this.scrollViewRef}
                  simultaneousHandlers={this.mainPanRef}
                  waitFor={this.failable}
                >
                  <Animated.ScrollView
                    ref={this.scrollViewComponentRef}
                    onScrollBeginDrag={this.registerFirstTouch}
                    horizontal={true}
                    onScrollEndDrag={this._onRegisterEnd}
                    bounces={false}
                    scrollEnabled={this.state.isScrollingContent}
                    contentContainerStyle={style}>
                    {children}
                  </Animated.ScrollView>
                </NativeViewGestureHandler>
              </Animated.View>
            </PanGestureHandler>
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
  constructor(props){
    super(props);
    // setTimeout(() => this.___e.setValue(0), 3000)

  }
  _renderHeader = () =>
    <View style={{ width: '100%', height: 32, backgroundColor: '#6200ee' }}/>;

  ___c = new Value(0);
  ___d = new Value(0);
  ___e = new Value(1000);
  ___done = new Value(1)
  scrollDisabled = new Value(0)
  render() {
    return (
      <View style={styles.container}>
        <Animated.Code>
          {() => cond(and(greaterThan(this.___d, 200), this.___done), [set(this.___e, this.___d), set(this.___done, 0)])}
        </Animated.Code>
        <Animated.ScrollView
          scrollEventThrottle={1}
          showsVerticalScrollIndicator={false}
          onLayout={Animated.event([
            { nativeEvent: {
              layout: {
                height: this.___c
              }
            }}
          ])
          }

          onScroll={Animated.event([
            { nativeEvent: {
              contentOffset: {
                y: this.___d
              }
            }}
          ])
          }
          bounces={false}
          contentContainerStyle={{
          }}
          style={{
            // height: 200
          }}
        >
          <Animated.View
            style={{
              overflow: 'visible',
            }}
          >

            <Animated.View style={{height: this.___e, backgroundColor: 'red'}}/>
            <Animated.View style={{height: 100, backgroundColor: 'red'}}/>
            <Animated.View style={{height: 100, backgroundColor: 'blue'}}/>
            <Animated.View style={{height: 100, backgroundColor: 'red'}}/>
            <Animated.View style={{height: 100, backgroundColor: 'blue'}}/>
            <Animated.View style={{height: 100, backgroundColor: 'red'}}/>
            <Animated.View style={{height: 100, backgroundColor: 'blue'}}/>
            <Animated.View style={{height: 100, backgroundColor: 'red'}}/>
            <Animated.View style={{height: 100, backgroundColor: 'blue'}}/>
          </Animated.View>
        </Animated.ScrollView>
        <Animated.View/>
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