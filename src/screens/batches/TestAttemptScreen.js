import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Image,
  StatusBar,
} from 'react-native';

import {
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import apiClient from '../../api/client';
import { useAuth } from '../../auth/AuthContext';


const COLORS = {
  primary: '#6D28D9',
  primaryDark: '#21105D',
  primaryLight: '#F3E8FF',
  primarySoft: '#FAF8FF',

  background: '#FBFBFE',

  white: '#FFFFFF',

  text: '#111827',
  muted: '#6B7280',
  lightMuted: '#9CA3AF',

  border: '#E8E3F3',

  success: '#059669',
  successLight: '#ECFDF5',

  danger: '#DC2626',
  dangerLight: '#FEF2F2',

  orange: '#F97316',
  orangeLight: '#FFF7ED',

  blue: '#2563EB',
  blueLight: '#EFF6FF',
};


function makeAnswerKey(sectionId, questionId) {
  return `${sectionId}::${questionId}`;
}


function buildInitialAnswers(attemptAnswers = []) {
  const map = {};

  attemptAnswers.forEach((ans) => {
    const sectionId = String(ans.sectionId || '');

    const questionId = String(
      ans.question || ans.questionId || ''
    );

    if (!sectionId || !questionId) {
      return;
    }

    map[makeAnswerKey(sectionId, questionId)] = {
      selectedOption: ans.selectedOption || null,

      selectedOptions: Array.isArray(
        ans.selectedOptions
      )
        ? ans.selectedOptions
        : [],

      numericalAnswer:
        ans.numericalAnswer === null ||
        ans.numericalAnswer === undefined
          ? ''
          : String(ans.numericalAnswer),
    };
  });

  return map;
}


function Legend({
  label,
  color,
  value,
  icon,
}) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendIconWrap,
          {
            backgroundColor: `${color}15`,
          },
        ]}
      >
        {icon ? (
          <MaterialCommunityIcons
            name={icon}
            size={16}
            color={color}
          />
        ) : (
          <View
            style={[
              styles.legendDot,
              {
                backgroundColor: color,
              },
            ]}
          />
        )}
      </View>

      <View style={styles.legendContent}>
        <Text style={styles.legendText}>
          {label}
        </Text>

        <Text
          style={[
            styles.legendValue,
            {
              color,
            },
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );
}


export default function TestAttemptScreen({
  route,
  navigation,
}) {
  const { logout } = useAuth();

  const insets = useSafeAreaInsets();

  const {
    test,
    attempt,
    batchId,
  } = route.params;


  const [answersMap, setAnswersMap] = useState(
    buildInitialAnswers(attempt?.answers || [])
  );


  const [visitedMap, setVisitedMap] = useState(
    () => {
      const initial = {};

      (attempt?.answers || []).forEach(
        (ans) => {
          const sectionId = String(
            ans.sectionId || ''
          );

          const questionId = String(
            ans.question ||
              ans.questionId ||
              ''
          );

          if (!sectionId || !questionId) {
            return;
          }

          initial[
            makeAnswerKey(
              sectionId,
              questionId
            )
          ] = true;
        }
      );

      return initial;
    }
  );


  const [reviewedMap, setReviewedMap] =
    useState({});

  const [timeLeft, setTimeLeft] =
    useState(0);

  const [timerReady, setTimerReady] =
    useState(false);

  const [
    currentSectionIndex,
    setCurrentSectionIndex,
  ] = useState(0);

  const [
    currentQuestionIndex,
    setCurrentQuestionIndex,
  ] = useState(0);

  const [submitting, setSubmitting] =
    useState(false);

  const [
    imageAspectRatio,
    setImageAspectRatio,
  ] = useState(1.6);

  const [statsMenuOpen, setStatsMenuOpen] =
    useState(false);


  const questionEnteredAtRef = useRef(
    Date.now()
  );

  const timeSpentMapRef = useRef({});

  const timerIntervalRef = useRef(null);


  const flattened = useMemo(() => {
    const list = [];

    (test.sections || []).forEach(
      (section) => {
        (section.questions || []).forEach(
          (entry) => {
            if (!entry?.question?._id) {
              return;
            }

            list.push({
              sectionId: String(section._id),

              sectionName:
                section.name || 'Section',

              questionEntryId: String(
                entry._id
              ),

              questionId: String(
                entry.question._id
              ),

              question: entry.question,
            });
          }
        );
      }
    );

    return list;
  }, [test.sections]);


  const totalQuestions = flattened.length;


  const currentSection =
    (test.sections || [])[
      currentSectionIndex
    ] || null;


  const currentQuestionEntry =
    currentSection
      ? (currentSection.questions || [])[
          currentQuestionIndex
        ] || null
      : null;


  const currentQuestion =
    currentQuestionEntry?.question || null;


  const currentKey =
    currentSection && currentQuestion
      ? makeAnswerKey(
          String(currentSection._id),
          String(currentQuestion._id)
        )
      : null;


  useEffect(() => {
    const startedAt = attempt?.startedAt
      ? new Date(
          attempt.startedAt
        ).getTime()
      : Date.now();

    const totalDurationSeconds =
      Number(test.duration || 0) * 60;

    const elapsed = Math.max(
      0,
      Math.floor(
        (Date.now() - startedAt) / 1000
      )
    );

    setTimeLeft(
      Math.max(
        0,
        totalDurationSeconds - elapsed
      )
    );

    setTimerReady(true);
  }, [attempt?.startedAt, test.duration]);


  const flushCurrentQuestionTime =
    useCallback(() => {
      if (!currentKey) {
        return;
      }

      const now = Date.now();

      const spent = Math.max(
        0,
        Math.floor(
          (now -
            questionEnteredAtRef.current) /
            1000
        )
      );

      if (spent > 0) {
        timeSpentMapRef.current[currentKey] =
          (timeSpentMapRef.current[
            currentKey
          ] || 0) + spent;
      }

      questionEnteredAtRef.current = now;
    }, [currentKey]);


  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(
        timerIntervalRef.current
      );
    }

    timerIntervalRef.current = setInterval(
      () => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(
              timerIntervalRef.current
            );

            timerIntervalRef.current = null;

            return 0;
          }

          return prev - 1;
        });
      },
      1000
    );

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(
          timerIntervalRef.current
        );

        timerIntervalRef.current = null;
      }
    };
  }, []);


  useEffect(() => {
    if (
      !timerReady ||
      timeLeft !== 0 ||
      submitting
    ) {
      return;
    }

    const runAutoSubmit = async () => {
      await submitTest(true);
    };

    runAutoSubmit();
  }, [
    submitting,
    timeLeft,
    timerReady,
  ]);


  useEffect(() => {
    if (!currentKey) {
      return;
    }

    setVisitedMap((prev) => {
      if (prev[currentKey]) {
        return prev;
      }

      return {
        ...prev,
        [currentKey]: true,
      };
    });

    questionEnteredAtRef.current =
      Date.now();
  }, [currentKey]);


  useEffect(() => {
    return () => {
      flushCurrentQuestionTime();
    };
  }, [flushCurrentQuestionTime]);


  const getStatus = useCallback(
    (key) => {
      const ans = answersMap[key];

      const isAnswered =
        !!ans &&
        (
          !!ans.selectedOption ||
          (
            Array.isArray(
              ans.selectedOptions
            ) &&
            ans.selectedOptions.length > 0
          ) ||
          (
            ans.numericalAnswer !== '' &&
            ans.numericalAnswer !== null &&
            ans.numericalAnswer !== undefined
          )
        );

      const isVisited = !!visitedMap[key];

      const isReviewed =
        !!reviewedMap[key];


      if (isReviewed && isAnswered) {
        return 'answered-marked';
      }

      if (isReviewed) {
        return 'marked';
      }

      if (isAnswered) {
        return 'answered';
      }

      if (isVisited) {
        return 'not-answered';
      }

      return 'not-visited';
    },
    [
      answersMap,
      reviewedMap,
      visitedMap,
    ]
  );


  const statusColors = {
    'not-visited': {
      bg: '#E5E7EB',
      text: '#6B7280',
    },

    'not-answered': {
      bg: '#EF4444',
      text: '#FFFFFF',
    },

    answered: {
      bg: '#10B981',
      text: '#FFFFFF',
    },

    marked: {
      bg: '#A855F7',
      text: '#FFFFFF',
    },

    'answered-marked': {
      bg: '#6D28D9',
      text: '#FFFFFF',
    },
  };


  const timerDisplay = useMemo(() => {
    const hours = Math.floor(
      timeLeft / 3600
    );

    const minutes = Math.floor(
      (timeLeft % 3600) / 60
    );

    const seconds = timeLeft % 60;


    if (hours > 0) {
      return `${hours}:${String(
        minutes
      ).padStart(2, '0')}:${String(
        seconds
      ).padStart(2, '0')}`;
    }


    return `${String(minutes).padStart(
      2,
      '0'
    )}:${String(seconds).padStart(
      2,
      '0'
    )}`;
  }, [timeLeft]);


  const sectionAnsweredMap = useMemo(
    () => {
      const map = {};

      (test.sections || []).forEach(
        (section) => {
          const sectionId = String(
            section._id
          );

          let count = 0;

          (
            section.questions || []
          ).forEach((entry) => {
            const qId = String(
              entry?.question?._id || ''
            );

            if (!qId) {
              return;
            }

            const key = makeAnswerKey(
              sectionId,
              qId
            );

            const status = getStatus(key);

            if (
              status === 'answered' ||
              status === 'answered-marked'
            ) {
              count += 1;
            }
          });

          map[sectionId] = count;
        }
      );

      return map;
    },
    [getStatus, test.sections]
  );


  const overallStats = useMemo(() => {
    let answered = 0;
    let notAnswered = 0;
    let marked = 0;
    let notVisited = 0;


    flattened.forEach((item) => {
      const key = makeAnswerKey(
        item.sectionId,
        item.questionId
      );

      const status = getStatus(key);


      if (status === 'answered') {
        answered += 1;
      } else if (
        status === 'not-answered'
      ) {
        notAnswered += 1;
      } else if (
        status === 'marked' ||
        status === 'answered-marked'
      ) {
        marked += 1;
      } else {
        notVisited += 1;
      }
    });


    return {
      answered,
      notAnswered,
      marked,
      notVisited,
    };
  }, [flattened, getStatus]);


  const sectionStats = useMemo(() => {
    return (test.sections || []).map(
      (section) => {
        let answered = 0;
        let marked = 0;
        let notVisited = 0;
        let notAnswered = 0;


        (
          section.questions || []
        ).forEach((entry) => {
          const qId = String(
            entry?.question?._id || ''
          );

          if (!qId) {
            return;
          }


          const key = makeAnswerKey(
            String(section._id),
            qId
          );


          const status = getStatus(key);


          if (status === 'answered') {
            answered += 1;
          } else if (
            status === 'answered-marked'
          ) {
            answered += 1;
            marked += 1;
          } else if (
            status === 'marked'
          ) {
            marked += 1;
          } else if (
            status === 'not-answered'
          ) {
            notAnswered += 1;
          } else {
            notVisited += 1;
          }
        });


        return {
          sectionId: String(section._id),

          sectionName:
            section.name || 'Section',

          total: (
            section.questions || []
          ).length,

          answered,
          marked,
          notAnswered,
          notVisited,
        };
      }
    );
  }, [getStatus, test.sections]);


  const jumpToQuestion = (
    sectionIndex,
    questionIndex
  ) => {
    flushCurrentQuestionTime();

    setCurrentSectionIndex(sectionIndex);

    setCurrentQuestionIndex(questionIndex);
  };


  const setMcqAnswer = (
    sectionId,
    questionId,
    option
  ) => {
    const key = makeAnswerKey(
      sectionId,
      questionId
    );

    setAnswersMap((prev) => ({
      ...prev,

      [key]: {
        selectedOption: option,

        selectedOptions: [],

        numericalAnswer: '',
      },
    }));
  };


  const toggleMsqAnswer = (
    sectionId,
    questionId,
    option
  ) => {
    const key = makeAnswerKey(
      sectionId,
      questionId
    );


    setAnswersMap((prev) => {
      const current = prev[key] || {
        selectedOption: null,

        selectedOptions: [],

        numericalAnswer: '',
      };


      const currentSet = new Set(
        current.selectedOptions || []
      );


      if (currentSet.has(option)) {
        currentSet.delete(option);
      } else {
        currentSet.add(option);
      }


      return {
        ...prev,

        [key]: {
          selectedOption: null,

          selectedOptions:
            Array.from(currentSet),

          numericalAnswer: '',
        },
      };
    });
  };


  const setNumericalAnswer = (
    sectionId,
    questionId,
    value
  ) => {
    const key = makeAnswerKey(
      sectionId,
      questionId
    );


    setAnswersMap((prev) => ({
      ...prev,

      [key]: {
        selectedOption: null,

        selectedOptions: [],

        numericalAnswer: value,
      },
    }));


    setVisitedMap((prev) => ({
      ...prev,

      [key]: true,
    }));
  };


  const clearAnswer = (
    sectionId,
    questionId
  ) => {
    const key = makeAnswerKey(
      sectionId,
      questionId
    );


    setAnswersMap((prev) => {
      const next = {
        ...prev,
      };

      delete next[key];

      return next;
    });


    setReviewedMap((prev) => {
      if (!prev[key]) {
        return prev;
      }

      const next = {
        ...prev,
      };

      delete next[key];

      return next;
    });
  };


  const buildSubmitPayload = () => {
    return flattened.map((item) => {
      const key = makeAnswerKey(
        item.sectionId,
        item.questionId
      );


      const state = answersMap[key] || {};


      const numerical = String(
        state.numericalAnswer || ''
      ).trim();


      return {
        questionId: item.questionId,

        sectionId: item.sectionId,

        selectedOption:
          state.selectedOption || null,

        selectedOptions: Array.isArray(
          state.selectedOptions
        )
          ? state.selectedOptions
          : [],

        numericalAnswer:
          numerical === ''
            ? null
            : Number(numerical),

        timeSpent:
          timeSpentMapRef.current[key] || 0,
      };
    });
  };


  const submitTest = async (
    auto = false
  ) => {
    if (submitting) {
      return;
    }


    flushCurrentQuestionTime();


    setSubmitting(true);


    try {
      const payload = buildSubmitPayload();


      const res = await apiClient.post(
        `/tests/${test._id}/submit`,
        {
          answers: payload,

          batchId,
        }
      );


      navigation.replace('TestResult', {
        testId: test._id,

        initialResult: {
          attempt: {
            totalScore:
              res.data?.totalScore,

            maxScore:
              res.data?.maxScore,

            answers:
              res.data?.answers || [],
          },

          test: {
            _id: test._id,

            name: test.name,

            sections:
              test.sections || [],
          },
        },
      });
    } catch (e) {
      if (e.response?.status === 401) {
        logout();

        return;
      }


      Alert.alert(
        'Submit failed',
        e.response?.data?.message ||
          'Please try again.'
      );


      if (auto) {
        setTimeLeft(1);
      }
    } finally {
      setSubmitting(false);
    }
  };


  const handleSubmitPress = () => {
    if (submitting) {
      return;
    }


    const {
      answered,
      notAnswered,
      marked,
      notVisited,
    } = overallStats;


    const message =
      `Answered: ${answered}\n` +
      `Not Answered: ${notAnswered}\n` +
      `Marked: ${marked}\n` +
      `Not Visited: ${notVisited}\n\n` +
      'Once submitted, this attempt will be finalized.';


    Alert.alert(
      'Submit test',
      message,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },

        {
          text: 'Submit',
          style: 'destructive',

          onPress: () =>
            submitTest(false),
        },
      ]
    );
  };


  const goPrev = () => {
    if (!currentSection) {
      return;
    }


    if (currentQuestionIndex > 0) {
      jumpToQuestion(
        currentSectionIndex,
        currentQuestionIndex - 1
      );

      return;
    }


    if (currentSectionIndex > 0) {
      const prevSectionIndex =
        currentSectionIndex - 1;


      const prevSection =
        test.sections[prevSectionIndex];


      const prevQuestionCount = (
        prevSection?.questions || []
      ).length;


      jumpToQuestion(
        prevSectionIndex,
        Math.max(
          prevQuestionCount - 1,
          0
        )
      );
    }
  };


  const goNext = () => {
    if (!currentSection) {
      return;
    }


    const sectionQuestionCount = (
      currentSection.questions || []
    ).length;


    if (
      currentQuestionIndex <
      sectionQuestionCount - 1
    ) {
      jumpToQuestion(
        currentSectionIndex,
        currentQuestionIndex + 1
      );

      return;
    }


    if (
      currentSectionIndex <
      (test.sections || []).length - 1
    ) {
      jumpToQuestion(
        currentSectionIndex + 1,
        0
      );
    }
  };


  const handleSaveAndNext = () => {
    if (!currentKey) {
      return;
    }


    setReviewedMap((prev) => {
      if (!prev[currentKey]) {
        return prev;
      }


      const next = {
        ...prev,
      };


      delete next[currentKey];


      return next;
    });


    goNext();
  };


  const handleMarkAndNext = () => {
    if (!currentKey) {
      return;
    }


    setReviewedMap((prev) => ({
      ...prev,

      [currentKey]: true,
    }));


    goNext();
  };


  const handleQuestionImageLoad = (
    event
  ) => {
    const width =
      event?.nativeEvent?.source?.width;

    const height =
      event?.nativeEvent?.source?.height;


    if (!width || !height) {
      return;
    }


    const ratio = width / height;


    if (
      Number.isFinite(ratio) &&
      ratio > 0
    ) {
      setImageAspectRatio(ratio);
    }
  };


  useEffect(() => {
    setImageAspectRatio(1.6);
  }, [currentQuestion?.imageUrl]);


  if (
    !currentSection ||
    !currentQuestionEntry ||
    !currentQuestion ||
    !currentKey
  ) {
    return (
      <SafeAreaView
        style={styles.safeArea}
        edges={['top', 'bottom']}
      >
        <View style={styles.centerState}>
          <View style={styles.errorIconWrap}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={38}
              color={COLORS.danger}
            />
          </View>

          <Text style={styles.errorTitle}>
            Question Unavailable
          </Text>

          <Text style={styles.errorText}>
            Question data is unavailable.
          </Text>
        </View>
      </SafeAreaView>
    );
  }


  const currentAnswerState =
    answersMap[currentKey] || {
      selectedOption: null,

      selectedOptions: [],

      numericalAnswer: '',
    };


  const currentType =
    currentQuestion.type || 'mcq';


  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top', 'bottom']}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor={COLORS.background}
      />


      <View style={styles.root}>
        <View style={styles.topDecoration} />

        <ScrollView
          contentContainerStyle={{
            paddingBottom: Math.max(
              insets.bottom + 100,
              120
            ),
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* HEADER */}

          <View style={styles.header}>
          <TouchableOpacity
            style={styles.menuBtn}
            onPress={() =>
              setStatsMenuOpen(true)
            }
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="menu"
              size={23}
              color={COLORS.primary}
            />
          </TouchableOpacity>


          <View style={styles.headerContent}>
            <Text
              style={styles.headerTitle}
              numberOfLines={1}
            >
              {test.name || 'Test'}
            </Text>

            <View style={styles.liveRow}>
              <View style={styles.liveDot} />

              <Text style={styles.headerSubtitle}>
                Test in progress
              </Text>
            </View>
          </View>


          <View
            style={[
              styles.timerChip,

              timeLeft <= 300 &&
                styles.timerChipDanger,
            ]}
          >
            <MaterialCommunityIcons
              name="timer-outline"
              size={15}
              color={
                timeLeft <= 300
                  ? COLORS.danger
                  : COLORS.primary
              }
            />

            <Text
              style={[
                styles.timerText,

                timeLeft <= 300 &&
                  styles.timerTextDanger,
              ]}
            >
              {timerDisplay}
            </Text>
          </View>
        </View>


        {/* QUESTION PALETTE */}

        <View style={styles.paletteCardTop}>
          <View style={styles.paletteHeader}>
            <View>
              <Text style={styles.paletteTitle}>
                Question Palette
              </Text>

              <Text style={styles.paletteSubtitle}>
                {currentQuestionIndex + 1} of{' '}
                {
                  (
                    currentSection.questions ||
                    []
                  ).length
                }{' '}
                in this section
              </Text>
            </View>


            <View style={styles.overallProgress}>
              <Text
                style={styles.overallProgressText}
              >
                {overallStats.answered}/
                {totalQuestions}
              </Text>
            </View>
          </View>


          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={
              false
            }
            contentContainerStyle={
              styles.paletteGrid
            }
          >
            {(
              currentSection.questions || []
            ).map((entry, qIndex) => {
              const qId = String(
                entry?.question?._id || ''
              );

              if (!qId) {
                return null;
              }


              const key = makeAnswerKey(
                String(currentSection._id),
                qId
              );


              const status = getStatus(key);


              const color =
                statusColors[status] ||
                statusColors['not-visited'];


              const active =
                qIndex ===
                currentQuestionIndex;


              return (
                <TouchableOpacity
                  key={key}
                  style={[
                    styles.paletteBtn,

                    {
                      backgroundColor:
                        color.bg,

                      borderColor: active
                        ? COLORS.primaryDark
                        : 'transparent',
                    },

                    active &&
                      styles.paletteBtnActive,
                  ]}
                  onPress={() =>
                    jumpToQuestion(
                      currentSectionIndex,
                      qIndex
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.paletteBtnText,

                      {
                        color: color.text,
                      },
                    ]}
                  >
                    {qIndex + 1}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>


        {/* SECTION TABS */}

        <ScrollView
          horizontal
          bounces={false}
          decelerationRate="fast"
          showsHorizontalScrollIndicator={
            false
          }
          contentInsetAdjustmentBehavior="never"
          overScrollMode="never"
          style={styles.sectionTabsOuter}
          contentContainerStyle={
            styles.sectionTabsWrap
          }
        >
          {(test.sections || []).map(
            (section, sectionIndex) => {
              const sectionId = String(
                section._id
              );


              const isActive =
                sectionIndex ===
                currentSectionIndex;


              const answered =
                sectionAnsweredMap[
                  sectionId
                ] || 0;


              const total = (
                section.questions || []
              ).length;


              return (
                <TouchableOpacity
                  key={sectionId}
                  style={[
                    styles.sectionTabBtn,

                    isActive &&
                      styles.sectionTabBtnActive,
                  ]}
                  onPress={() =>
                    jumpToQuestion(
                      sectionIndex,
                      0
                    )
                  }
                  activeOpacity={0.8}
                >
                  <View
                    style={styles.sectionTabLeft}
                  >
                    <MaterialCommunityIcons
                      name={
                        isActive
                          ? 'book-open-page-variant'
                          : 'book-open-page-variant-outline'
                      }
                      size={16}
                      color={
                        isActive
                          ? COLORS.white
                          : COLORS.primary
                      }
                    />

                    <Text
                      style={[
                        styles.sectionTabText,

                        isActive &&
                          styles.sectionTabTextActive,
                      ]}
                      numberOfLines={1}
                    >
                      {section.name ||
                        `Section ${
                          sectionIndex + 1
                        }`}
                    </Text>
                  </View>


                  <View
                    style={[
                      styles.sectionTabBadge,

                      isActive &&
                        styles.sectionTabBadgeActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.sectionTabBadgeText,

                        isActive &&
                          styles.sectionTabBadgeTextActive,
                      ]}
                    >
                      {answered}/{total}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            }
          )}
        </ScrollView>


        {/* QUESTION */}

        <View style={styles.content}>
          <View style={styles.sectionCard}>
            {/* QUESTION HEADER */}

            <View style={styles.questionHead}>
              <View>
                <Text style={styles.questionLabel}>
                  QUESTION
                </Text>

                <Text style={styles.questionIndex}>
                  {currentQuestionIndex + 1}
                  <Text
                    style={styles.questionTotal}
                  >
                    {' '}
                    /{' '}
                    {
                      (
                        currentSection.questions ||
                        []
                      ).length
                    }
                  </Text>
                </Text>
              </View>


              <View style={styles.questionType}>
                <MaterialCommunityIcons
                  name={
                    currentType === 'numerical'
                      ? 'numeric'
                      : currentType === 'msq'
                        ? 'checkbox-multiple-marked-outline'
                        : 'radiobox-marked'
                  }
                  size={14}
                  color={COLORS.primary}
                />

                <Text
                  style={styles.questionTypeText}
                >
                  {currentType.toUpperCase()}
                </Text>
              </View>
            </View>


            {/* META */}

            <View style={styles.metaStrip}>
              <View style={styles.metaSection}>
                <View
                  style={styles.metaIconWrap}
                >
                  <MaterialCommunityIcons
                    name="book-outline"
                    size={15}
                    color={COLORS.primary}
                  />
                </View>

                <Text
                  style={styles.metaSectionText}
                  numberOfLines={1}
                >
                  {currentSection.name ||
                    'Section'}
                </Text>
              </View>


              <View style={styles.marksWrap}>
                <View style={styles.positiveMark}>
                  <Text
                    style={styles.positiveMarkText}
                  >
                    +
                    {currentQuestionEntry
                      .positiveMarks || 0}
                  </Text>
                </View>


                <View style={styles.negativeMark}>
                  <Text
                    style={styles.negativeMarkText}
                  >
                    -
                    {currentQuestionEntry
                      .negativeMarks || 0}
                  </Text>
                </View>
              </View>
            </View>


            {/* IMAGE */}

            {!!currentQuestion?.imageUrl && (
              <View
                style={styles.questionImageFrame}
              >
                <Image
                  key={currentQuestion.imageUrl}
                  source={{
                    uri: currentQuestion.imageUrl,
                  }}
                  style={[
                    styles.questionImage,

                    {
                      aspectRatio:
                        imageAspectRatio,
                    },
                  ]}
                  resizeMode="contain"
                  onLoad={
                    handleQuestionImageLoad
                  }
                />
              </View>
            )}


            {/* OPTIONS */}

            {(currentType === 'mcq' ||
              currentType === 'msq') && (
              <View style={styles.optionsRow}>
                {['A', 'B', 'C', 'D'].map(
                  (option) => {
                    const selected =
                      currentType === 'mcq'
                        ? currentAnswerState
                            .selectedOption ===
                          option
                        : (
                            currentAnswerState
                              .selectedOptions || []
                          ).includes(option);


                    return (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.optionBtn,

                          selected &&
                            styles.optionBtnActive,
                        ]}
                        onPress={() =>
                          currentType === 'mcq'
                            ? setMcqAnswer(
                                String(
                                  currentSection._id
                                ),
                                String(
                                  currentQuestion._id
                                ),
                                option
                              )
                            : toggleMsqAnswer(
                                String(
                                  currentSection._id
                                ),
                                String(
                                  currentQuestion._id
                                ),
                                option
                              )
                        }
                        activeOpacity={0.8}
                      >
                        <View
                          style={[
                            styles.optionBadge,

                            selected &&
                              styles.optionBadgeActive,
                          ]}
                        >
                          <Text
                            style={[
                              styles.optionBadgeText,

                              selected &&
                                styles.optionBadgeTextActive,
                            ]}
                          >
                            {option}
                          </Text>
                        </View>


                        <Text
                          style={[
                            styles.optionBtnText,

                            selected &&
                              styles.optionBtnTextActive,
                          ]}
                        >
                          Option {option}
                        </Text>


                        <View style={styles.optionSpacer} />


                        <MaterialCommunityIcons
                          name={
                            selected
                              ? 'check-circle'
                              : currentType === 'msq'
                                ? 'checkbox-blank-outline'
                                : 'circle-outline'
                          }
                          size={20}
                          color={
                            selected
                              ? COLORS.primary
                              : '#D1D5DB'
                          }
                        />
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>
            )}


            {/* NUMERICAL */}

            {currentType === 'numerical' && (
              <View
                style={styles.numericalWrap}
              >
                <Text
                  style={styles.numericalLabel}
                >
                  Your Numerical Answer
                </Text>

                <View
                  style={
                    styles.numericalInputWrap
                  }
                >
                  <MaterialCommunityIcons
                    name="calculator-variant-outline"
                    size={21}
                    color={COLORS.primary}
                  />

                  <TextInput
                    style={styles.numericalInput}
                    value={String(
                      currentAnswerState
                        .numericalAnswer || ''
                    )}
                    onChangeText={(value) =>
                      setNumericalAnswer(
                        String(
                          currentSection._id
                        ),
                        String(
                          currentQuestion._id
                        ),
                        value
                      )
                    }
                    placeholder="Enter numerical answer"
                    placeholderTextColor={
                      COLORS.lightMuted
                    }
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
            )}


            {/* ACTIONS */}

            <View style={styles.actionDivider} />


            <View style={styles.primaryActionRow}>
              <TouchableOpacity
                style={styles.actionMarkedBtn}
                onPress={handleMarkAndNext}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="bookmark-outline"
                  size={17}
                  color={COLORS.primary}
                />

                <Text
                  style={styles.actionMarkedText}
                >
                  Mark & Next
                </Text>
              </TouchableOpacity>


              <TouchableOpacity
                style={styles.actionPrimaryBtn}
                onPress={handleSaveAndNext}
                activeOpacity={0.85}
              >
                <Text
                  style={styles.actionPrimaryText}
                >
                  Save & Next
                </Text>

                <MaterialCommunityIcons
                  name="arrow-right"
                  size={17}
                  color={COLORS.white}
                />
              </TouchableOpacity>
            </View>


            <View style={styles.secondaryActionRow}>
              <TouchableOpacity
                style={styles.navBtn}
                onPress={goPrev}
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="chevron-left"
                  size={20}
                  color={COLORS.text}
                />

                <Text style={styles.navBtnText}>
                  Previous
                </Text>
              </TouchableOpacity>


              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() =>
                  clearAnswer(
                    String(currentSection._id),
                    String(currentQuestion._id)
                  )
                }
                activeOpacity={0.8}
              >
                <MaterialCommunityIcons
                  name="eraser-variant"
                  size={16}
                  color={COLORS.danger}
                />

                <Text style={styles.clearText}>
                  Clear Answer
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </ScrollView>


        {/* DRAWER */}

        {statsMenuOpen && (
          <>
            <TouchableOpacity
              style={styles.statsOverlay}
              activeOpacity={1}
              onPress={() =>
                setStatsMenuOpen(false)
              }
            />


            <View style={styles.statsDrawer}>
              <LinearGradient
                colors={[
                  COLORS.primaryDark,
                  COLORS.primary,
                ]}
                start={{
                  x: 0,
                  y: 0,
                }}
                end={{
                  x: 1,
                  y: 1,
                }}
                style={styles.statsHeader}
              >
                <View>
                  <Text style={styles.statsTitle}>
                    Test Summary
                  </Text>

                  <Text
                    style={styles.statsSubtitle}
                  >
                    Track your attempt progress
                  </Text>
                </View>


                <TouchableOpacity
                  onPress={() =>
                    setStatsMenuOpen(false)
                  }
                  style={styles.statsCloseBtn}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name="close"
                    size={20}
                    color={COLORS.white}
                  />
                </TouchableOpacity>
              </LinearGradient>


              <View style={styles.drawerActionWrap}>
                <TouchableOpacity
                  style={[
                    styles.drawerSubmitBtn,

                    submitting &&
                      styles.disabledBtn,
                  ]}
                  onPress={() => {
                    setStatsMenuOpen(false);

                    handleSubmitPress();
                  }}
                  disabled={submitting}
                  activeOpacity={0.85}
                >
                  {submitting ? (
                    <ActivityIndicator
                      size="small"
                      color={COLORS.white}
                    />
                  ) : (
                    <>
                      <MaterialCommunityIcons
                        name="check-decagram-outline"
                        size={18}
                        color={COLORS.white}
                      />

                      <Text
                        style={
                          styles.drawerSubmitText
                        }
                      >
                        Submit Test
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>


              <ScrollView
                contentContainerStyle={[
                  styles.statsContent,

                  {
                    paddingBottom: Math.max(
                      insets.bottom + 30,
                      50
                    ),
                  },
                ]}
                showsVerticalScrollIndicator={
                  false
                }
              >
                <Text
                  style={styles.statsBlockTitle}
                >
                  Overall Progress
                </Text>


                <View style={styles.legendWrap}>
                  <Legend
                    label="Answered"
                    color={COLORS.success}
                    value={overallStats.answered}
                    icon="check-circle-outline"
                  />

                  <Legend
                    label="Marked"
                    color="#A855F7"
                    value={overallStats.marked}
                    icon="bookmark-outline"
                  />

                  <Legend
                    label="Not Answered"
                    color="#EF4444"
                    value={
                      overallStats.notAnswered
                    }
                    icon="close-circle-outline"
                  />

                  <Legend
                    label="Not Visited"
                    color="#9CA3AF"
                    value={overallStats.notVisited}
                    icon="circle-outline"
                  />
                </View>


                <Text
                  style={styles.statsBlockTitle}
                >
                  Section Wise
                </Text>


                {sectionStats.map(
                  (section, index) => (
                    <View
                      key={section.sectionId}
                      style={
                        styles.sectionStatsCard
                      }
                    >
                      <View
                        style={
                          styles.sectionStatsHeader
                        }
                      >
                        <View
                          style={
                            styles.sectionStatsNumber
                          }
                        >
                          <Text
                            style={
                              styles.sectionStatsNumberText
                            }
                          >
                            {index + 1}
                          </Text>
                        </View>


                        <View
                          style={
                            styles.sectionStatsTitleWrap
                          }
                        >
                          <Text
                            style={
                              styles.sectionStatsTitle
                            }
                            numberOfLines={2}
                          >
                            {section.sectionName}
                          </Text>

                          <Text
                            style={
                              styles.sectionStatsTotal
                            }
                          >
                            {section.total} Questions
                          </Text>
                        </View>
                      </View>


                      <View
                        style={
                          styles.sectionStatsGrid
                        }
                      >
                        <View
                          style={
                            styles.sectionStatItem
                          }
                        >
                          <Text
                            style={[
                              styles.sectionStatValue,
                              {
                                color:
                                  COLORS.success,
                              },
                            ]}
                          >
                            {section.answered}
                          </Text>

                          <Text
                            style={
                              styles.sectionStatLabel
                            }
                          >
                            Answered
                          </Text>
                        </View>


                        <View
                          style={
                            styles.sectionStatItem
                          }
                        >
                          <Text
                            style={[
                              styles.sectionStatValue,
                              {
                                color: '#A855F7',
                              },
                            ]}
                          >
                            {section.marked}
                          </Text>

                          <Text
                            style={
                              styles.sectionStatLabel
                            }
                          >
                            Marked
                          </Text>
                        </View>


                        <View
                          style={
                            styles.sectionStatItem
                          }
                        >
                          <Text
                            style={[
                              styles.sectionStatValue,
                              {
                                color:
                                  COLORS.danger,
                              },
                            ]}
                          >
                            {section.notAnswered}
                          </Text>

                          <Text
                            style={
                              styles.sectionStatLabel
                            }
                          >
                            Skipped
                          </Text>
                        </View>


                        <View
                          style={
                            styles.sectionStatItem
                          }
                        >
                          <Text
                            style={[
                              styles.sectionStatValue,
                              {
                                color:
                                  COLORS.lightMuted,
                              },
                            ]}
                          >
                            {section.notVisited}
                          </Text>

                          <Text
                            style={
                              styles.sectionStatLabel
                            }
                          >
                            Unvisited
                          </Text>
                        </View>
                      </View>
                    </View>
                  )
                )}
              </ScrollView>
            </View>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  root: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  topDecoration: {
    position: 'absolute',
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#EDE9FE',
    top: -180,
    right: -100,
    opacity: 0.75,
  },


  /* HEADER */

  header: {
    minHeight: 70,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },

  menuBtn: {
    width: 43,
    height: 43,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primaryDark,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },

  headerContent: {
    flex: 1,
    marginHorizontal: 12,
  },

  headerTitle: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: -0.3,
  },

  liveRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },

  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 5,
  },

  headerSubtitle: {
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '600',
  },

  timerChip: {
    minWidth: 93,
    height: 42,
    paddingHorizontal: 11,
    borderRadius: 14,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  timerChipDanger: {
    backgroundColor: COLORS.dangerLight,
    borderColor: '#FECACA',
  },

  timerText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '900',
  },

  timerTextDanger: {
    color: COLORS.danger,
  },


  /* PALETTE */

  paletteCardTop: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 13,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },

  paletteHeader: {
    marginBottom: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  paletteTitle: {
    color: COLORS.text,
    fontSize: 12,
    fontWeight: '900',
  },

  paletteSubtitle: {
    marginTop: 2,
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: '600',
  },

  overallProgress: {
    minWidth: 50,
    height: 29,
    paddingHorizontal: 9,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  overallProgressText: {
    color: COLORS.primary,
    fontSize: 9,
    fontWeight: '900',
  },

  paletteGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },

  paletteBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },

  paletteBtnActive: {
    transform: [
      {
        scale: 1.06,
      },
    ],
  },

  paletteBtnText: {
    fontSize: 10,
    fontWeight: '900',
  },


  /* SECTIONS */

  sectionTabsOuter: {
    backgroundColor: COLORS.background,
    height: 64,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },

  sectionTabsWrap: {
    paddingHorizontal: 16,
    gap: 9,
    alignItems: 'center',
    height: 64,
    flexDirection: 'row',
  },

  sectionTabBtn: {
    height: 43,
    paddingHorizontal: 12,
    borderRadius: 14,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 9,
  },

  sectionTabBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },

  sectionTabLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  sectionTabText: {
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '800',
  },

  sectionTabTextActive: {
    color: COLORS.white,
  },

  sectionTabBadge: {
    minWidth: 43,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
  },

  sectionTabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },

  sectionTabBadgeText: {
    color: COLORS.primary,
    fontSize: 8,
    fontWeight: '900',
  },

  sectionTabBadgeTextActive: {
    color: COLORS.white,
  },


  /* CONTENT */

  content: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },

  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: 25,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: COLORS.primaryDark,
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 4,
  },


  /* QUESTION */

  questionHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 13,
  },

  questionLabel: {
    color: COLORS.primary,
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 1.1,
  },

  questionIndex: {
    marginTop: 2,
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -0.8,
  },

  questionTotal: {
    color: COLORS.lightMuted,
    fontSize: 13,
    fontWeight: '700',
  },

  questionType: {
    height: 34,
    paddingHorizontal: 10,
    borderRadius: 11,
    backgroundColor: COLORS.primaryLight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },

  questionTypeText: {
    color: COLORS.primary,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.6,
  },


  /* META */

  metaStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 17,
    backgroundColor: COLORS.primarySoft,
    borderWidth: 1,
    borderColor: '#F0ECF8',
    borderRadius: 14,
    padding: 9,
  },

  metaSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },

  metaIconWrap: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },

  metaSectionText: {
    flex: 1,
    color: COLORS.muted,
    fontSize: 9,
    fontWeight: '800',
  },

  marksWrap: {
    flexDirection: 'row',
    gap: 6,
  },

  positiveMark: {
    minWidth: 37,
    height: 28,
    paddingHorizontal: 7,
    borderRadius: 9,
    backgroundColor: COLORS.successLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  positiveMarkText: {
    color: COLORS.success,
    fontSize: 9,
    fontWeight: '900',
  },

  negativeMark: {
    minWidth: 37,
    height: 28,
    paddingHorizontal: 7,
    borderRadius: 9,
    backgroundColor: COLORS.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  negativeMarkText: {
    color: COLORS.danger,
    fontSize: 9,
    fontWeight: '900',
  },


  /* IMAGE */

  questionImageFrame: {
    width: '100%',
    backgroundColor: COLORS.white,
    marginBottom: 18,
    overflow: 'hidden',
    borderRadius: 15,
  },

  questionImage: {
    width: '100%',
    maxWidth: '100%',
    height: undefined,
  },


  /* OPTIONS */

  optionsRow: {
    gap: 10,
    marginBottom: 8,
  },

  optionBtn: {
    minHeight: 58,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 17,
    paddingVertical: 10,
    paddingHorizontal: 11,
    backgroundColor: COLORS.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },

  optionBtnActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },

  optionBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },

  optionBadgeActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },

  optionBadgeText: {
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '900',
  },

  optionBadgeTextActive: {
    color: COLORS.white,
  },

  optionBtnText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '700',
  },

  optionBtnTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '900',
  },

  optionSpacer: {
    flex: 1,
  },


  /* NUMERICAL */

  numericalWrap: {
    marginBottom: 10,
  },

  numericalLabel: {
    marginBottom: 8,
    color: COLORS.text,
    fontSize: 10,
    fontWeight: '900',
  },

  numericalInputWrap: {
    minHeight: 58,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.primarySoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },

  numericalInput: {
    flex: 1,
    minHeight: 56,
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
  },


  /* ACTIONS */

  actionDivider: {
    height: 1,
    backgroundColor: '#F1EDF8',
    marginVertical: 17,
  },

  primaryActionRow: {
    flexDirection: 'row',
    gap: 9,
  },

  actionPrimaryBtn: {
    flex: 1.1,
    minHeight: 49,
    borderRadius: 15,
    paddingHorizontal: 13,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    shadowColor: COLORS.primary,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },

  actionPrimaryText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: '900',
  },

  actionMarkedBtn: {
    flex: 1,
    minHeight: 49,
    borderRadius: 15,
    paddingHorizontal: 11,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: '#DDD6FE',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  actionMarkedText: {
    color: COLORS.primary,
    fontSize: 10,
    fontWeight: '900',
  },

  secondaryActionRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 9,
  },

  navBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: '#F8F7FC',
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },

  navBtnText: {
    color: COLORS.text,
    fontSize: 9,
    fontWeight: '800',
  },

  clearBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 14,
    backgroundColor: COLORS.dangerLight,
    borderWidth: 1,
    borderColor: '#FECACA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },

  clearText: {
    color: COLORS.danger,
    fontSize: 9,
    fontWeight: '900',
  },


  /* DRAWER */

  statsOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(33,16,93,0.42)',
    zIndex: 15,
  },

  statsDrawer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    width: '84%',
    maxWidth: 360,
    backgroundColor: COLORS.background,
    zIndex: 16,
    borderTopLeftRadius: 28,
    borderBottomLeftRadius: 28,
    overflow: 'hidden',
    shadowColor: COLORS.primaryDark,
    shadowOffset: {
      width: -8,
      height: 0,
    },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 15,
  },

  statsHeader: {
    paddingHorizontal: 18,
    paddingTop: 22,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  statsTitle: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
  },

  statsSubtitle: {
    marginTop: 4,
    color: '#DDD6FE',
    fontSize: 9,
    fontWeight: '600',
  },

  statsCloseBtn: {
    width: 39,
    height: 39,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  drawerActionWrap: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 3,
  },

  drawerSubmitBtn: {
    minHeight: 50,
    paddingHorizontal: 14,
    borderRadius: 15,
    backgroundColor: COLORS.danger,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    shadowColor: COLORS.danger,
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },

  drawerSubmitText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '900',
  },

  statsContent: {
    padding: 16,
  },

  statsBlockTitle: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
    marginTop: 10,
    marginBottom: 10,
  },


  /* LEGEND */

  legendWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  legendItem: {
    width: '48.5%',
    minHeight: 70,
    marginBottom: 9,
    padding: 10,
    borderRadius: 15,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
  },

  legendIconWrap: {
    width: 35,
    height: 35,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },

  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  legendContent: {
    flex: 1,
  },

  legendText: {
    color: COLORS.muted,
    fontSize: 7,
    fontWeight: '700',
  },

  legendValue: {
    marginTop: 2,
    fontSize: 16,
    fontWeight: '900',
  },


  /* SECTION STATS */

  sectionStatsCard: {
    marginBottom: 11,
    padding: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    backgroundColor: COLORS.white,
  },

  sectionStatsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  sectionStatsNumber: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 9,
  },

  sectionStatsNumberText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '900',
  },

  sectionStatsTitleWrap: {
    flex: 1,
  },

  sectionStatsTitle: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '900',
  },

  sectionStatsTotal: {
    marginTop: 2,
    color: COLORS.muted,
    fontSize: 8,
    fontWeight: '600',
  },

  sectionStatsGrid: {
    marginTop: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  sectionStatItem: {
    width: '24%',
    alignItems: 'center',
  },

  sectionStatValue: {
    fontSize: 15,
    fontWeight: '900',
  },

  sectionStatLabel: {
    marginTop: 3,
    color: COLORS.muted,
    fontSize: 6,
    fontWeight: '700',
    textAlign: 'center',
  },


  /* ERROR */

  centerState: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },

  errorIconWrap: {
    width: 78,
    height: 78,
    borderRadius: 25,
    backgroundColor: COLORS.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  errorTitle: {
    marginTop: 17,
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '900',
  },

  errorText: {
    marginTop: 6,
    color: COLORS.muted,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },

  disabledBtn: {
    opacity: 0.65,
  },
});