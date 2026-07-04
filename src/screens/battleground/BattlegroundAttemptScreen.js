import React, { useMemo, useState } from 'react';

import {
  Alert,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  ActivityIndicator,
} from 'react-native';

import {
  SafeAreaView,
} from 'react-native-safe-area-context';

import {
  MaterialCommunityIcons,
} from '@expo/vector-icons';

import {
  LinearGradient,
} from 'expo-linear-gradient';

import AppHeader from '../../components/AppHeader';

import apiClient from '../../api/client';


const SCREEN_WIDTH = Dimensions.get('window').width;


const COLORS = {

  primary: '#6D28D9',

  primaryDark: '#4C1D95',

  primaryMedium: '#7C3AED',

  primaryLight: '#EDE9FE',

  primarySoft: '#F5F3FF',

  background: '#F8F7FC',

  white: '#FFFFFF',

  text: '#171717',

  textSecondary: '#64748B',

  textMuted: '#94A3B8',

  border: '#E8E5EF',

  success: '#16A34A',

  successLight: '#DCFCE7',

  orange: '#EA580C',

  orangeLight: '#FFEDD5',

  danger: '#DC2626',

};


export default function BattlegroundAttemptScreen({

  navigation,

  route,

}) {

  const item = route.params?.item || {};

  const itemId = String(item?._id || '');


  const [selectedOption, setSelectedOption] = useState(null);

  const [selectedOptions, setSelectedOptions] = useState([]);

  const [numericalAnswer, setNumericalAnswer] = useState('');

  const [submitting, setSubmitting] = useState(false);

  const [imageAspectRatio, setImageAspectRatio] = useState(16 / 9);


  // =========================================================
  // QUESTION TYPE
  // =========================================================

  const questionType = useMemo(

    () =>

      String(

        item?.questionType ||

        item?.type ||

        item?.question?.type ||

        'mcq'

      ).toLowerCase(),

    [item]

  );


  // =========================================================
  // QUESTION TEXT
  // =========================================================

  const questionText =

    item?.questionText ||

    item?.question?.text ||

    item?.question?.questionText ||

    item?.text ||

    'Question text not available.';


  const imageUrl =

    item?.imageUrl ||

    item?.question?.imageUrl ||

    '';


  // =========================================================
  // OPTION TEXT
  // =========================================================

  const getOptionText = (optionKey) => {

    const fallback = `Option ${optionKey}`;

    const rawOptions =

      item?.options ||

      item?.question?.options;


    if (Array.isArray(rawOptions)) {

      const index =

        ['A', 'B', 'C', 'D'].indexOf(optionKey);


      return String(

        rawOptions[index] ||

        fallback

      );

    }


    if (

      rawOptions &&

      typeof rawOptions === 'object'

    ) {

      return String(

        rawOptions[optionKey] ||

        rawOptions[optionKey.toLowerCase()] ||

        fallback

      );

    }


    return String(

      item?.[`option${optionKey}`] ||

      item?.[`option${optionKey.toLowerCase()}`] ||

      item?.question?.[`option${optionKey}`] ||

      item?.question?.[`option${optionKey.toLowerCase()}`] ||

      fallback

    );

  };


  // =========================================================
  // MSQ SELECTION
  // =========================================================

  const toggleMsqOption = (option) => {

    setSelectedOptions((previousOptions) => {

      const nextSet = new Set(previousOptions);


      if (nextSet.has(option)) {

        nextSet.delete(option);

      } else {

        nextSet.add(option);

      }


      return Array.from(nextSet);

    });

  };


  // =========================================================
  // ANSWER VALIDATION
  // =========================================================

  const hasAnswer =

    (

      questionType === 'mcq' &&

      !!selectedOption

    ) ||

    (

      questionType === 'msq' &&

      selectedOptions.length > 0

    ) ||

    (

      questionType === 'numerical' &&

      String(numericalAnswer).trim().length > 0

    );


  // =========================================================
  // BUILD ANSWER
  // =========================================================

  const buildPlainAnswer = () => {

    if (questionType === 'mcq') {

      return selectedOption || '';

    }


    if (questionType === 'msq') {

      return selectedOptions.join(',');

    }


    if (questionType === 'numerical') {

      return String(numericalAnswer).trim();

    }


    return '';

  };


  // =========================================================
  // IMAGE LOAD
  // =========================================================

  const handleQuestionImageLoad = (event) => {

    const width =

      event?.nativeEvent?.source?.width;


    const height =

      event?.nativeEvent?.source?.height;


    if (width && height) {

      setImageAspectRatio(

        width / height

      );

    }

  };


  // =========================================================
  // SUBMIT ANSWER
  // =========================================================

  const submitAnswer = async () => {

    const answer = buildPlainAnswer();


    const numericalValue =

      Number(numericalAnswer);


    if (!itemId || !answer) {

      return;

    }


    setSubmitting(true);


    try {

      const res = await apiClient.post(

        '/battlegrounds/submit',

        {

          answer,

          quizId: itemId,

          battlegroundId: itemId,

          subjectKey: item.subjectKey,

          selectedOption:

            questionType === 'mcq'

              ? selectedOption

              : null,

          selectedOptions:

            questionType === 'msq'

              ? selectedOptions

              : [],

          numericalAnswer:

            questionType === 'numerical' &&

              Number.isFinite(numericalValue)

              ? numericalValue

              : null,

        }

      );


      Alert.alert(

        res.data?.isCorrect

          ? 'Correct Answer! 🎉'

          : 'Answer Submitted',

        res.data?.isCorrect

          ? 'Excellent! Your Battleground streak has been updated.'

          : 'Your answer has been submitted successfully.',

        [

          {

            text: 'Continue',

            onPress: () => navigation.goBack(),

          },

        ]

      );

    } catch (err) {

      Alert.alert(

        'Submission Failed',

        err?.response?.data?.message ||

        'Unable to submit your answer. Please try again.'

      );

    } finally {

      setSubmitting(false);

    }

  };


  // =========================================================
  // QUESTION TYPE CONFIG
  // =========================================================

  const questionTypeConfig = useMemo(() => {

    if (questionType === 'msq') {

      return {

        label: 'MULTIPLE SELECT',

        instruction: 'Select all correct options',

        icon: 'checkbox-multiple-marked-outline',

      };

    }


    if (questionType === 'numerical') {

      return {

        label: 'NUMERICAL',

        instruction: 'Enter the correct numerical value',

        icon: 'numeric',

      };

    }


    return {

      label: 'SINGLE CORRECT',

      instruction: 'Select one correct option',

      icon: 'radiobox-marked',

    };

  }, [questionType]);


  return (

    <>

      <StatusBar

        barStyle="light-content"

        backgroundColor={COLORS.primaryDark}

      />


      <SafeAreaView

        style={styles.safeArea}

        edges={['top']}

      >


        <AppHeader

          title="Daily Battleground"

          navigation={navigation}

          showBack

        />


        <ScrollView

          style={styles.scrollView}

          contentContainerStyle={styles.content}

          showsVerticalScrollIndicator={false}

          keyboardShouldPersistTaps="handled"

        >


          {/* =================================================
              BATTLE HEADER
          ================================================= */}


          <LinearGradient

            colors={[

              COLORS.primaryDark,

              COLORS.primary,

              '#8B5CF6',

            ]}

            start={{

              x: 0,

              y: 0,

            }}

            end={{

              x: 1,

              y: 1,

            }}

            style={styles.battleHeader}

          >


            <View style={styles.heroCircleOne} />

            <View style={styles.heroCircleTwo} />


            <View style={styles.battleTopRow}>


              <View style={styles.battleTag}>


                <MaterialCommunityIcons

                  name="sword-cross"

                  size={13}

                  color="#FFFFFF"

                />


                <Text style={styles.battleTagText}>

                  DAILY CHALLENGE

                </Text>


              </View>


              <View style={styles.questionTypeBadge}>


                <MaterialCommunityIcons

                  name={questionTypeConfig.icon}

                  size={12}

                  color="#FFFFFF"

                />


                <Text style={styles.questionTypeBadgeText}>

                  {questionTypeConfig.label}

                </Text>


              </View>


            </View>


            <Text style={styles.battleTitle}>

              Battle Question

            </Text>


            <Text style={styles.battleSubtitle}>

              Answer carefully. Your daily streak depends on this battle.

            </Text>


            <View style={styles.subjectRow}>


              <View style={styles.subjectIcon}>


                <MaterialCommunityIcons

                  name="book-open-page-variant-outline"

                  size={17}

                  color="#FFFFFF"

                />


              </View>


              <View style={styles.subjectContent}>


                <Text style={styles.subjectLabel}>

                  SUBJECT

                </Text>


                <Text style={styles.subjectName}>

                  {String(

                    item.subjectKey || 'Subject'

                  ).toUpperCase()}

                </Text>


              </View>


            </View>


          </LinearGradient>


          {/* =================================================
              INSTRUCTION
          ================================================= */}


          <View style={styles.instructionCard}>


            <View style={styles.instructionIcon}>


              <MaterialCommunityIcons

                name={questionTypeConfig.icon}

                size={20}

                color={COLORS.primary}

              />


            </View>


            <View style={styles.instructionContent}>


              <Text style={styles.instructionLabel}>

                QUESTION TYPE

              </Text>


              <Text style={styles.instructionTitle}>

                {questionTypeConfig.instruction}

              </Text>


            </View>


          </View>


          {/* =================================================
              QUESTION CARD
          ================================================= */}


          <View style={styles.questionCard}>


            <View style={styles.questionHeader}>


              <View style={styles.questionNumber}>


                <Text style={styles.questionNumberText}>

                  Q

                </Text>


              </View>


              <Text style={styles.questionHeaderText}>

                QUESTION

              </Text>


            </View>


            <Text style={styles.questionText}>

              {questionText}

            </Text>


            {!!imageUrl && (


              <View style={styles.questionImageWrap}>


                <Image

                  source={{ uri: imageUrl }}

                  style={[

                    styles.questionImage,

                    {

                      aspectRatio: imageAspectRatio,

                    },

                  ]}

                  resizeMode="contain"

                  onLoad={handleQuestionImageLoad}

                />


                <View style={styles.imageLabel}>


                  <MaterialCommunityIcons

                    name="image-outline"

                    size={12}

                    color={COLORS.textSecondary}

                  />


                  <Text style={styles.imageLabelText}>

                    QUESTION IMAGE

                  </Text>


                </View>


              </View>


            )}


          </View>


          {/* =================================================
              OPTIONS
          ================================================= */}


          {(

            questionType === 'mcq' ||

            questionType === 'msq'

          ) && (


              <View style={styles.answerSection}>


                <View style={styles.answerHeader}>


                  <Text style={styles.answerTitle}>

                    Choose Your Answer

                  </Text>


                  {questionType === 'msq' && (


                    <Text style={styles.selectedCount}>

                      {selectedOptions.length} selected

                    </Text>


                  )}


                </View>


                <View style={styles.optionsWrap}>


                  {['A', 'B', 'C', 'D'].map(

                    (option) => {


                      const selected =

                        questionType === 'mcq'

                          ? selectedOption === option

                          : selectedOptions.includes(option);


                      return (


                        <TouchableOpacity

                          key={option}

                          style={[

                            styles.optionBtn,

                            selected && styles.optionBtnActive,

                          ]}

                          activeOpacity={0.8}

                          disabled={submitting}

                          onPress={() => {


                            if (questionType === 'mcq') {


                              setSelectedOption(option);

                              setSelectedOptions([]);

                              setNumericalAnswer('');


                            } else {


                              setSelectedOption(null);

                              setNumericalAnswer('');

                              toggleMsqOption(option);


                            }


                          }}

                        >


                          <View

                            style={[

                              styles.optionKeyWrap,

                              selected && styles.optionKeyWrapActive,

                            ]}

                          >


                            <Text

                              style={[

                                styles.optionKey,

                                selected && styles.optionKeyActive,

                              ]}

                            >

                              {option}

                            </Text>


                          </View>


                          <Text

                            style={[

                              styles.optionText,

                              selected && styles.optionTextActive,

                            ]}

                          >

                            {getOptionText(option)}

                          </Text>


                          <View

                            style={[

                              questionType === 'mcq'

                                ? styles.radioOuter

                                : styles.checkboxOuter,

                              selected && styles.selectionOuterActive,

                            ]}

                          >


                            {selected && (


                              questionType === 'mcq'

                                ? (


                                  <View style={styles.radioInner} />


                                )

                                : (


                                  <MaterialCommunityIcons

                                    name="check"

                                    size={14}

                                    color="#FFFFFF"

                                  />


                                )


                            )}


                          </View>


                        </TouchableOpacity>


                      );

                    }

                  )}


                </View>


              </View>


            )}


          {/* =================================================
              NUMERICAL
          ================================================= */}


          {questionType === 'numerical' && (


            <View style={styles.answerSection}>


              <Text style={styles.answerTitle}>

                Enter Your Answer

              </Text>


              <View style={styles.numericalCard}>


                <View style={styles.numericalIcon}>


                  <MaterialCommunityIcons

                    name="calculator-variant-outline"

                    size={24}

                    color={COLORS.primary}

                  />


                </View>


                <TextInput

                  style={styles.input}

                  placeholder="Enter numerical value"

                  placeholderTextColor={COLORS.textMuted}

                  value={numericalAnswer}

                  onChangeText={(value) => {


                    setNumericalAnswer(value);

                    setSelectedOption(null);

                    setSelectedOptions([]);


                  }}

                  keyboardType="decimal-pad"

                  editable={!submitting}

                />


              </View>


              <View style={styles.numericalHint}>


                <MaterialCommunityIcons

                  name="information-outline"

                  size={14}

                  color={COLORS.primary}

                />


                <Text style={styles.numericalHintText}>

                  Enter only the numerical value. Use decimal point where required.

                </Text>


              </View>


            </View>


          )}


          {/* =================================================
              ANSWER STATUS
          ================================================= */}


          <View

            style={[

              styles.answerStatusCard,

              hasAnswer && styles.answerStatusCardReady,

            ]}

          >


            <View

              style={[

                styles.answerStatusIcon,

                hasAnswer && styles.answerStatusIconReady,

              ]}

            >


              <MaterialCommunityIcons

                name={

                  hasAnswer

                    ? 'check-circle-outline'

                    : 'gesture-tap'

                }

                size={20}

                color={

                  hasAnswer

                    ? COLORS.success

                    : COLORS.textMuted

                }

              />


            </View>


            <View style={styles.answerStatusContent}>


              <Text

                style={[

                  styles.answerStatusTitle,

                  hasAnswer && styles.answerStatusTitleReady,

                ]}

              >

                {hasAnswer

                  ? 'Answer Selected'

                  : 'Waiting for your answer'}

              </Text>


              <Text style={styles.answerStatusText}>

                {hasAnswer

                  ? 'Review your answer before submitting the battle.'

                  : questionTypeConfig.instruction}

              </Text>


            </View>


          </View>


          {/* =================================================
              SUBMIT
          ================================================= */}


          <TouchableOpacity

            style={[

              styles.submitButtonWrap,

              (!hasAnswer || submitting) && styles.disabledBtn,

            ]}

            activeOpacity={0.88}

            onPress={submitAnswer}

            disabled={!hasAnswer || submitting}

          >


            <LinearGradient

              colors={[

                COLORS.primary,

                COLORS.primaryDark,

              ]}

              start={{

                x: 0,

                y: 0,

              }}

              end={{

                x: 1,

                y: 0,

              }}

              style={styles.submitBtn}

            >


              {submitting ? (


                <>


                  <ActivityIndicator

                    size="small"

                    color="#FFFFFF"

                  />


                  <Text style={styles.submitBtnText}>

                    Submitting Battle...

                  </Text>


                </>


              ) : (


                <>


                  <MaterialCommunityIcons

                    name="sword-cross"

                    size={19}

                    color="#FFFFFF"

                  />


                  <Text style={styles.submitBtnText}>

                    Submit Battle Answer

                  </Text>


                  <MaterialCommunityIcons

                    name="arrow-right"

                    size={18}

                    color="#FFFFFF"

                  />


                </>


              )}


            </LinearGradient>


          </TouchableOpacity>


          <View style={styles.warningCard}>


            <MaterialCommunityIcons

              name="shield-alert-outline"

              size={17}

              color={COLORS.orange}

            />


            <Text style={styles.warningText}>

              Once submitted, your answer cannot be changed. Check carefully before continuing.

            </Text>


          </View>


        </ScrollView>


      </SafeAreaView>

    </>

  );

}


const styles = StyleSheet.create({

  safeArea: {

    flex: 1,

    backgroundColor: COLORS.background,

  },


  scrollView: {

    flex: 1,

    backgroundColor: COLORS.background,

  },


  content: {

    paddingBottom: 60,

  },


  battleHeader: {

    marginHorizontal: 15,

    marginTop: 15,

    borderRadius: 24,

    padding: 20,

    overflow: 'hidden',

    shadowColor: COLORS.primaryDark,

    shadowOffset: {

      width: 0,

      height: 8,

    },

    shadowOpacity: 0.18,

    shadowRadius: 17,

    elevation: 8,

  },


  heroCircleOne: {

    position: 'absolute',

    width: 160,

    height: 160,

    borderRadius: 80,

    backgroundColor: 'rgba(255,255,255,0.08)',

    right: -55,

    top: -75,

  },


  heroCircleTwo: {

    position: 'absolute',

    width: 110,

    height: 110,

    borderRadius: 55,

    backgroundColor: 'rgba(255,255,255,0.06)',

    left: -45,

    bottom: -60,

  },


  battleTopRow: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

  },


  battleTag: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 5,

    backgroundColor: 'rgba(255,255,255,0.15)',

    borderWidth: 1,

    borderColor: 'rgba(255,255,255,0.15)',

    borderRadius: 8,

    paddingHorizontal: 9,

    paddingVertical: 6,

  },


  battleTagText: {

    color: '#FFFFFF',

    fontSize: 7,

    fontWeight: '900',

    letterSpacing: 0.8,

  },


  questionTypeBadge: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 4,

    backgroundColor: 'rgba(255,255,255,0.14)',

    borderRadius: 8,

    paddingHorizontal: 8,

    paddingVertical: 6,

  },


  questionTypeBadgeText: {

    color: '#FFFFFF',

    fontSize: 6,

    fontWeight: '900',

    letterSpacing: 0.5,

  },


  battleTitle: {

    color: '#FFFFFF',

    fontSize: 27,

    fontWeight: '900',

    marginTop: 22,

  },


  battleSubtitle: {

    color: '#DDD6FE',

    fontSize: 10,

    lineHeight: 16,

    fontWeight: '600',

    marginTop: 7,

    maxWidth: '88%',

  },


  subjectRow: {

    minHeight: 58,

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: 'rgba(255,255,255,0.11)',

    borderWidth: 1,

    borderColor: 'rgba(255,255,255,0.12)',

    borderRadius: 15,

    marginTop: 18,

    paddingHorizontal: 11,

  },


  subjectIcon: {

    width: 38,

    height: 38,

    borderRadius: 12,

    backgroundColor: 'rgba(255,255,255,0.14)',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 10,

  },


  subjectContent: {

    flex: 1,

  },


  subjectLabel: {

    color: '#C4B5FD',

    fontSize: 6,

    fontWeight: '900',

    letterSpacing: 0.7,

  },


  subjectName: {

    color: '#FFFFFF',

    fontSize: 13,

    fontWeight: '900',

    marginTop: 3,

  },


  instructionCard: {

    marginHorizontal: 15,

    marginTop: 14,

    minHeight: 66,

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: COLORS.primarySoft,

    borderWidth: 1,

    borderColor: '#DDD6FE',

    borderRadius: 17,

    paddingHorizontal: 13,

  },


  instructionIcon: {

    width: 42,

    height: 42,

    borderRadius: 14,

    backgroundColor: COLORS.primaryLight,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 11,

  },


  instructionContent: {

    flex: 1,

  },


  instructionLabel: {

    color: COLORS.primary,

    fontSize: 6,

    fontWeight: '900',

    letterSpacing: 0.7,

  },


  instructionTitle: {

    color: COLORS.text,

    fontSize: 12,

    fontWeight: '800',

    marginTop: 3,

  },


  questionCard: {

    marginHorizontal: 15,

    marginTop: 14,

    backgroundColor: COLORS.white,

    borderRadius: 20,

    borderWidth: 1,

    borderColor: COLORS.border,

    padding: 16,

    shadowColor: COLORS.primaryDark,

    shadowOffset: {

      width: 0,

      height: 4,

    },

    shadowOpacity: 0.05,

    shadowRadius: 10,

    elevation: 3,

  },


  questionHeader: {

    flexDirection: 'row',

    alignItems: 'center',

    marginBottom: 12,

  },


  questionNumber: {

    width: 31,

    height: 31,

    borderRadius: 10,

    backgroundColor: COLORS.primary,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 9,

  },


  questionNumberText: {

    color: '#FFFFFF',

    fontSize: 13,

    fontWeight: '900',

  },


  questionHeaderText: {

    color: COLORS.primary,

    fontSize: 8,

    fontWeight: '900',

    letterSpacing: 0.9,

  },


  questionText: {

    color: COLORS.text,

    fontSize: 15,

    lineHeight: 24,

    fontWeight: '700',

  },


  questionImageWrap: {

    marginTop: 16,

    backgroundColor: '#FAFAFA',

    borderWidth: 1,

    borderColor: COLORS.border,

    borderRadius: 15,

    overflow: 'hidden',

  },


  questionImage: {

    width: '100%',

    backgroundColor: '#FFFFFF',

  },


  imageLabel: {

    height: 32,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 5,

    borderTopWidth: 1,

    borderTopColor: COLORS.border,

  },


  imageLabelText: {

    color: COLORS.textSecondary,

    fontSize: 6,

    fontWeight: '900',

    letterSpacing: 0.7,

  },


  answerSection: {

    marginHorizontal: 15,

    marginTop: 22,

  },


  answerHeader: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

  },


  answerTitle: {

    color: COLORS.text,

    fontSize: 18,

    fontWeight: '900',

  },


  selectedCount: {

    color: COLORS.primary,

    fontSize: 8,

    fontWeight: '800',

    backgroundColor: COLORS.primaryLight,

    paddingHorizontal: 8,

    paddingVertical: 5,

    borderRadius: 999,

  },


  optionsWrap: {

    marginTop: 8,

  },


  optionBtn: {

    minHeight: 66,

    borderWidth: 1,

    borderColor: COLORS.border,

    borderRadius: 17,

    paddingHorizontal: 12,

    paddingVertical: 10,

    marginTop: 9,

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: COLORS.white,

  },


  optionBtnActive: {

    borderWidth: 2,

    borderColor: COLORS.primary,

    backgroundColor: COLORS.primarySoft,

  },


  optionKeyWrap: {

    width: 40,

    height: 40,

    borderRadius: 13,

    backgroundColor: '#F1F5F9',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 11,

  },


  optionKeyWrapActive: {

    backgroundColor: COLORS.primary,

  },


  optionKey: {

    color: COLORS.textSecondary,

    fontSize: 13,

    fontWeight: '900',

  },


  optionKeyActive: {

    color: '#FFFFFF',

  },


  optionText: {

    flex: 1,

    color: COLORS.text,

    fontSize: 12,

    lineHeight: 18,

    fontWeight: '700',

    paddingRight: 10,

  },


  optionTextActive: {

    color: COLORS.primaryDark,

  },


  radioOuter: {

    width: 20,

    height: 20,

    borderRadius: 10,

    borderWidth: 2,

    borderColor: '#CBD5E1',

    alignItems: 'center',

    justifyContent: 'center',

  },


  checkboxOuter: {

    width: 20,

    height: 20,

    borderRadius: 6,

    borderWidth: 2,

    borderColor: '#CBD5E1',

    alignItems: 'center',

    justifyContent: 'center',

  },


  selectionOuterActive: {

    borderColor: COLORS.primary,

    backgroundColor: COLORS.primary,

  },


  radioInner: {

    width: 8,

    height: 8,

    borderRadius: 4,

    backgroundColor: '#FFFFFF',

  },


  numericalCard: {

    minHeight: 66,

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: COLORS.white,

    borderWidth: 1,

    borderColor: COLORS.border,

    borderRadius: 17,

    marginTop: 12,

    paddingHorizontal: 12,

  },


  numericalIcon: {

    width: 43,

    height: 43,

    borderRadius: 14,

    backgroundColor: COLORS.primaryLight,

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 10,

  },


  input: {

    flex: 1,

    color: COLORS.text,

    fontSize: 15,

    fontWeight: '700',

    paddingVertical: 13,

  },


  numericalHint: {

    flexDirection: 'row',

    alignItems: 'flex-start',

    gap: 6,

    marginTop: 9,

    paddingHorizontal: 4,

  },


  numericalHintText: {

    flex: 1,

    color: COLORS.textSecondary,

    fontSize: 8,

    lineHeight: 13,

    fontWeight: '600',

  },


  answerStatusCard: {

    marginHorizontal: 15,

    marginTop: 20,

    minHeight: 64,

    flexDirection: 'row',

    alignItems: 'center',

    backgroundColor: '#F8FAFC',

    borderWidth: 1,

    borderColor: '#E2E8F0',

    borderRadius: 17,

    paddingHorizontal: 12,

  },


  answerStatusCardReady: {

    backgroundColor: '#F0FDF4',

    borderColor: '#BBF7D0',

  },


  answerStatusIcon: {

    width: 40,

    height: 40,

    borderRadius: 13,

    backgroundColor: '#F1F5F9',

    alignItems: 'center',

    justifyContent: 'center',

    marginRight: 10,

  },


  answerStatusIconReady: {

    backgroundColor: COLORS.successLight,

  },


  answerStatusContent: {

    flex: 1,

  },


  answerStatusTitle: {

    color: COLORS.textSecondary,

    fontSize: 11,

    fontWeight: '900',

  },


  answerStatusTitleReady: {

    color: '#166534',

  },


  answerStatusText: {

    color: COLORS.textSecondary,

    fontSize: 8,

    lineHeight: 12,

    fontWeight: '600',

    marginTop: 3,

  },


  submitButtonWrap: {

    marginHorizontal: 15,

    marginTop: 16,

    borderRadius: 16,

    overflow: 'hidden',

    shadowColor: COLORS.primaryDark,

    shadowOffset: {

      width: 0,

      height: 6,

    },

    shadowOpacity: 0.2,

    shadowRadius: 12,

    elevation: 6,

  },


  submitBtn: {

    minHeight: 56,

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'center',

    gap: 9,

    paddingHorizontal: 16,

  },


  submitBtnText: {

    color: '#FFFFFF',

    fontSize: 13,

    fontWeight: '900',

  },


  disabledBtn: {

    opacity: 0.45,

  },


  warningCard: {

    marginHorizontal: 15,

    marginTop: 12,

    flexDirection: 'row',

    alignItems: 'flex-start',

    backgroundColor: COLORS.orangeLight,

    borderRadius: 13,

    paddingHorizontal: 11,

    paddingVertical: 10,

    gap: 7,

  },


  warningText: {

    flex: 1,

    color: '#9A3412',

    fontSize: 8,

    lineHeight: 13,

    fontWeight: '700',

  },

});