import re

with open("src/screens/dashboard/DashboardScreen.js", "r") as f:
    content = f.read()

# 1. Add isToday helper and update loadSchedule
load_schedule_replacement = """
    const isToday = (dateString) => {
      if (!dateString) return false;
      const date = new Date(dateString);
      const today = new Date();
      return date.getDate() === today.getDate() &&
             date.getMonth() === today.getMonth() &&
             date.getFullYear() === today.getFullYear();
    };

    const loadSchedule = async () => {
      setScheduleLoading(true);

      try {
        const data = await getCourse(
          selectedCohort
        );

        setSchedule({
          live: (data.live || []).filter(c => isToday(c.scheduledAt)),
          upcoming: (data.upcoming || []).filter(c => isToday(c.scheduledAt)),
          completed: (data.completed || []).filter(c => isToday(c.scheduledAt)),
          cancelled: (data.cancelled || []).filter(c => isToday(c.scheduledAt)),
        });
"""
content = re.sub(
    r"const loadSchedule = async \(\) => \{\s+setScheduleLoading\(true\);\s+try \{\s+const data = await getCourse\(\s+selectedCohort\s+\);\s+setSchedule\(\{\s+live: data\.live \|\| \[\],\s+upcoming: data\.upcoming \|\| \[\],\s+completed: data\.completed \|\| \[\],\s+cancelled: data\.cancelled \|\| \[\],\s+\}\);",
    load_schedule_replacement,
    content,
    flags=re.MULTILINE
)

# 2. Extract batchPickerCard and cohorts logic
batch_picker_regex = r"          \{cohortsLoading \? \(\s+<ActivityIndicator\s+color=\{PURPLE\}\s+style=\{styles\.loader\}\s+/>\s+\) : cohorts\.length === 0 \? \(\s+<View style=\{styles\.emptyCard\}>\s+<MaterialCommunityIcons\s+name=\"school-outline\"\s+size=\{34\}\s+color=\"#C4B5FD\"\s+/>\s+<Text style=\{styles\.emptyTitle\}>\s+No active batch\s+</Text>\s+<Text style=\{styles\.emptyText\}>\s+Enroll in a batch to see your\s+classes and learning schedule\.\s+</Text>\s+</View>\s+\) : \(\s+<>\s+\{\/\* BATCH PICKER \*\/\}\s+<View\s+style=\{styles\.batchPickerCard\}\s+>\s+<Text\s+style=\{\s+styles\.batchPickerLabel\s+\}\s+>\s+ACTIVE BATCH\s+</Text>\s+<View style=\{styles\.pickerWrap\}>\s+<Picker\s+selectedValue=\{\s+selectedCohort\s+\}\s+onValueChange=\{\s+setSelectedCohort\s+\}\s+style=\{styles\.picker\}\s+dropdownIconColor=\{PURPLE\}\s+>\s+\{cohorts\.map\(cohort => \(\s+<Picker\.Item\s+key=\{cohort\._id\}\s+label=\{\s+cohort\.name \|\|\s+'Unnamed Batch'\s+\}\s+value=\{cohort\._id\}\s+color=\{TEXT\}\s+/>\s+\)\)\}\s+</Picker>\s+</View>\s+</View>"

batch_picker_match = re.search(batch_picker_regex, content)
if batch_picker_match:
    batch_picker_code = batch_picker_match.group(0)
    # Remove it from its original place (we'll replace the whole schedule section later)
else:
    print("Could not find batch picker code")

# 3. Insert batch picker after WELCOME
welcome_regex = r"          </View>\s+\{\/\* ================================================= \*\/\}\s+\{\/\* STATISTICS \*\/\}"
welcome_replacement = f"""          </View>

          {{/* ================================================= */}}
          {{/* ACTIVE BATCH */}}
          {{/* ================================================= */}}

{batch_picker_code}
            </>
          )}

          {{/* ================================================= */}}
          {{/* STATISTICS */}}"""

content = re.sub(welcome_regex, welcome_replacement, content)

# 4. Replace the old TODAY SCHEDULE and CONTINUE LEARNING section
# The old section starts with "TODAY SCHEDULE" and goes all the way down.
old_schedule_regex = r"          \{\/\* ================================================= \*\/\}\s+\{\/\* TODAY SCHEDULE \*\/\}.*?(?=          \{\/\* ================================================= \*\/\}\s+\{\/\* FOOTER \*\/\})"

new_schedule_code = """          {/* ================================================= */}
          {/* HORIZONTAL SCHEDULE SECTIONS */}
          {/* ================================================= */}

          {scheduleLoading ? (
            <ActivityIndicator color={PURPLE} style={styles.loader} />
          ) : (
            <>
              {/* LIVE NOW */}
              <View style={styles.sectionHeading}>
                <Text style={styles.sectionTitle}>🔴 Live Now</Text>
              </View>
              {schedule.live.length > 0 ? (
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={schedule.live}
                  keyExtractor={item => item._id}
                  renderItem={({ item }) => (
                    <View style={{ width: 280, marginRight: 16, paddingLeft: 16 }}>
                      {renderScheduleCard(item)}
                    </View>
                  )}
                  contentContainerStyle={{ paddingRight: 16 }}
                />
              ) : (
                <View style={[styles.emptyCard, { marginHorizontal: 16 }]}>
                  <Text style={styles.emptyText}>No live classes right now.</Text>
                </View>
              )}

              {/* UPCOMING */}
              <View style={[styles.sectionHeading, { marginTop: 20 }]}>
                <Text style={styles.sectionTitle}>⏳ Upcoming Today</Text>
              </View>
              {schedule.upcoming.length > 0 ? (
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={schedule.upcoming}
                  keyExtractor={item => item._id}
                  renderItem={({ item }) => (
                    <View style={{ width: 280, marginRight: 16, paddingLeft: 16 }}>
                      {renderScheduleCard(item)}
                    </View>
                  )}
                  contentContainerStyle={{ paddingRight: 16 }}
                />
              ) : (
                <View style={[styles.emptyCard, { marginHorizontal: 16 }]}>
                  <Text style={styles.emptyText}>No upcoming classes today.</Text>
                </View>
              )}

              {/* COMPLETED */}
              <View style={[styles.sectionHeading, { marginTop: 20 }]}>
                <Text style={styles.sectionTitle}>✅ Completed Today</Text>
              </View>
              {schedule.completed.length > 0 ? (
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={schedule.completed}
                  keyExtractor={item => item._id}
                  renderItem={({ item }) => (
                    <View style={{ width: 280, marginRight: 16, paddingLeft: 16 }}>
                      {renderScheduleCard(item)}
                    </View>
                  )}
                  contentContainerStyle={{ paddingRight: 16 }}
                />
              ) : (
                <View style={[styles.emptyCard, { marginHorizontal: 16 }]}>
                  <Text style={styles.emptyText}>No completed classes today.</Text>
                </View>
              )}

              {/* CANCELLED */}
              <View style={[styles.sectionHeading, { marginTop: 20 }]}>
                <Text style={styles.sectionTitle}>❌ Cancelled Today</Text>
              </View>
              {schedule.cancelled.length > 0 ? (
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={schedule.cancelled}
                  keyExtractor={item => item._id}
                  renderItem={({ item }) => (
                    <View style={{ width: 280, marginRight: 16, paddingLeft: 16 }}>
                      {renderScheduleCard(item)}
                    </View>
                  )}
                  contentContainerStyle={{ paddingRight: 16 }}
                />
              ) : (
                <View style={[styles.emptyCard, { marginHorizontal: 16 }]}>
                  <Text style={styles.emptyText}>No cancelled classes today.</Text>
                </View>
              )}
            </>
          )}

"""

content = re.sub(old_schedule_regex, new_schedule_code, content, flags=re.DOTALL)

# Write back
with open("src/screens/dashboard/DashboardScreen.js", "w") as f:
    f.write(content)
