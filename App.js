import React, { Component } from 'react';
import { StyleSheet, View, Dimensions, ScrollView } from 'react-native';
import { NativeViewGestureHandler, PanGestureHandler, State } from 'react-native-gesture-handler';
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
  not,
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

    this.__dummyHeight = new Value(0);
    this.__scrollYListener = new Value(0);


    this.dragY = new Value(0);
    this.untraverdtedDragY = new Value(0);
    const state = new Value(-1);
    const dragVY = new Value(0);

    this._onGestureEventHeader = event([
      { nativeEvent: { translationY: this.dragY, velocityY: dragVY, state: state } },
    ]);

    this._onGestureEvent = event([
      { nativeEvent: { translationY: this.untraverdtedDragY, velocityY: dragVY, state: state } },
    ]);

    const transY = new Value();
    this.prevDragY = new Value(0);

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
    this.lastPositionOfDragBeforeChangingVisibility = new Value(0);

    this.isFistTouch = new Value(1);

    const finishedDragging = lessThan(transY, props.snapPoints[0]);
    const calledInCurrentBatch = new Value(0);
    this._transY = cond(
      eq(state, State.ACTIVE ),
      [
        stopClock(clock),
        set(transY,  add(transY, sub(this.dragY, this.prevDragY))),
        set(this.prevDragY, this.dragY),
        //call([transY], (x) => console.warn(x[0])),
        cond(lessThan(transY, props.snapPoints[0]), [
          cond(calledInCurrentBatch, 0, [
            set(calledInCurrentBatch, 1),
          ]),
          props.snapPoints[0]
        ], transY),
      ],
      [
        cond(and(eq(state, State.END), not(and(defined(transY), greaterThan(transY, props.snapPoints[0])))),
          set(this.isFistTouch, 1)),
        set(this.prevDragY, 0),
        set(
          transY,
          cond(and(defined(transY), greaterThan(transY, props.snapPoints[0])),
            runSpring(clock, transY, dragVY, snapPoint, ), props.snapPoints[0]
          )
        ),
      ]
    );
    this.isScrollViewVisible = eq(this._transY, this.props.snapPoints[0])
  }
  panRef = React.createRef()
  render() {
    const { children, containerStyle: style, renderHeader, ...rest } = this.props;
    return (
        <Animated.View style={[{ transform: [{ translateY: this._transY }] }, style]}>
          <Animated.Code>
            {() =>
              set(this.dragY, sub(this.untraverdtedDragY, this.lastPositionOfDragBeforeChangingVisibility))
            }
          </Animated.Code>
          <Animated.Code>
            {() =>
              onChange(this.isScrollViewVisible,
                cond(this.isScrollViewVisible, [
                  set(this.__dummyHeight, add(this.__scrollYListener))
                ], [
                 // set(this.prevDragY, this.untraverdtedDragY),
                  set(this.__dummyHeight, 1000),
                ]))
            }
          </Animated.Code>

          <Animated.Code>
            {() =>
              onChange(this.__scrollYListener,
                //onChange(this.isFistTouch,
                cond(this.isFistTouch,
                [
                  set(this.isFistTouch, 0),
                  cond(this.isScrollViewVisible,
                  set(this.lastPositionOfDragBeforeChangingVisibility, sub(this.__scrollYListener, this.__dummyHeight)))
                  //call([sub(this.__scrollYListener, this.__dummyHeight)], k => console.warn(k[0])),

                  //   set(this.lastPositionOfDragBeforeChangingVisibility, this.untraverdtedDragY),
                ],
                [
                  //  set(this.dragY, sub(this.untraverstedDragY, this.lastPositionOfDragBeforeChangingVisibility)),
                  // call([this.dragY], (t) => console.warn(t[0])),
                ]
              ))
            }
          </Animated.Code>
          <PanGestureHandler
            {...rest}
            maxPointers={1}
            onGestureEvent={this._onGestureEventHeader}
            onHandlerStateChange={this._onGestureEventHeader}>
            <Animated.View style={{ width: '100%'}}>
          {renderHeader && renderHeader()}
            </Animated.View>
          </PanGestureHandler>

            <PanGestureHandler
              {...rest}
              maxPointers={1}
              onGestureEvent={this._onGestureEvent}
              onHandlerStateChange={this._onGestureEvent}
              simultaneousHandlers={this.panRef}

            >
              <Animated.View
                style={{
                  width: '100%',
                  height: '100%' // hei - 0
                }}
              >
                <Animated.View
                  style={{
                    position: 'absolute',
                    height: '100%',
                    width: '100%',
                  }}
                >
                  {children}
                </Animated.View>

                <NativeViewGestureHandler
                  ref = {this.panRef}
                >
                <Animated.ScrollView
                  scrollEventThrottle={1}
                  showsVerticalScrollIndicator={false}
                  onScroll={Animated.event([
                    { nativeEvent: {
                      contentOffset: {
                        y: this.__scrollYListener //need to make wait for scroll sart
                      }
                    }}
                  ])
                  }
                  style={{
                    opacity: (cond(this.isScrollViewVisible, 1, 0.1)),
                    height: '100%',
                    width: '100%',
                  }}
                >
                  <Animated.View style={{ height: this.__dummyHeight }}/>
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
    <View style = {{ width: '100%', height: 32, backgroundColor: '#6200ee' }}/>
  render() {
    return (
      <View style={styles.container}>
        <ListAccExample/>
        <BottomSheetBehaviour
          containerStyle={styles.innerContainer}
          snapPoints = {[50, 300, 500]}
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