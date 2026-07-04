const fs = require('fs');

let content = fs.readFileSync('src/screens/dashboard/DashboardScreen.js', 'utf8');

// 1. Update loadSchedule logic
const oldLoadScheduleRegex = /const loadSchedule = async \(\) => \{\s+setScheduleLoading\(true\);\s+try \{\s+const data = await getCourse\(\s+selectedCohort\s+\);\s+setSchedule\(\{\s+live: data\.live \|\| \[\],\s+upcoming: data\.upcoming \|\| \[\],\s+completed: data\.completed \|\| \[\],\s+cancelled: data\.cancelled \|\| \[\],\s+\}\);/m;

const newLoadSchedule = `
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
`;

content = content.replace(oldLoadScheduleRegex, newLoadSchedule);


// 2. Extract batchPickerCard
const startBatchPicker = content.indexOf('{cohortsLoading ? (');
const endBatchPicker = content.indexOf('{/* ================================================= */\n          {/* CONTINUE LEARNING');

if (startBatchPicker === -1 || endBatchPicker === -1) {
  console.log("Could not find batch picker boundaries");
  process.exit(1);
}

// We need to carefully extract the batchPicker block up to the activeClasses rendering
// Actually, it's better to just extract the EXACT code for batchPickerCard and remove it from bottom.
const batchPickerRegex = /\{\/\* BATCH PICKER \*\/\}[\s\S]*?<\/View>\s+<\/View>/;
const batchPickerMatch = content.match(batchPickerRegex);
let batchPickerCode = '';

if (batchPickerMatch) {
    batchPickerCode = batchPickerMatch[0];
    content = content.replace(batchPickerRegex, '');
} else {
    console.log("Could not find batch picker code");
    process.exit(1);
}

// Extract the "cohortsLoading" wrapper because it wraps the whole section
const cohortsWrapperRegex = /\{cohortsLoading \? \([\s\S]*?style=\{styles\.loader\}[\s\S]*?/>\s+\) : cohorts\.length === 0 \? \([\s\S]*?<\/View>\s+\) : \(\s+<>/;
const cohortsWrapperMatch = content.match(cohortsWrapperRegex);
let cohortsWrapperCode = '';
if (cohortsWrapperMatch) {
    cohortsWrapperCode = cohortsWrapperMatch[0];
    content = content.replace(cohortsWrapperRegex, '');
}

// Insert them after Welcome
const welcomeRegex = /<\/View>\s+\{\/\* ================================================= \*\/\}\s+\{\/\* STATISTICS \*\/\}/;
content = content.replace(welcomeRegex, `</View>

          {/* ================================================= */}
          {/* ACTIVE BATCH */}
          {/* ================================================= */}
          ${cohortsWrapperCode}
          ${batchPickerCode}
            </>
          )}

          {/* ================================================= */}
          {/* STATISTICS */}`);

// Remove the remaining schedule list
const todayScheduleRegex = /\{\/\* ================================================= \*\/\}\s+\{\/\* TODAY SCHEDULE \*\/\}[\s\S]*?\{\/\* ================================================= \*\/\}\s+\{\/\* FOOTER \*\/\}/;

const newTodaySchedule = `          {/* ================================================= */}
          {/* TODAY SCHEDULE - HORIZONTAL CATEGORIES */}
          {/* ================================================= */}

          {scheduleLoading ? (
            <ActivityIndicator color="#6D28D9" style={[styles.loader, { marginTop: 20 }]} />
          ) : (
            <>
              {/* LIVE NOW */}
              <View style={[styles.sectionHeading, { marginTop: 16 }]}>
                <Text style={styles.sectionTitle}>🔴 Live Now</Text>
              </View>
              {schedule.live.length > 0 ? (
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={schedule.live}
                  keyExtractor={item => item._id}
                  renderItem={({ item }) => (
                    <View style={{ width: 280, marginLeft: 16 }}>
                      {renderScheduleCard(item)}
                    </View>
                  )}
                  contentContainerStyle={{ paddingRight: 32 }}
                />
              ) : (
                <View style={[styles.emptyCard, { marginHorizontal: 16 }]}>
                  <Text style={styles.emptyText}>No live classes today.</Text>
                </View>
              )}

              {/* UPCOMING */}
              <View style={[styles.sectionHeading, { marginTop: 24 }]}>
                <Text style={styles.sectionTitle}>⏳ Upcoming Today</Text>
              </View>
              {schedule.upcoming.length > 0 ? (
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={schedule.upcoming}
                  keyExtractor={item => item._id}
                  renderItem={({ item }) => (
                    <View style={{ width: 280, marginLeft: 16 }}>
                      {renderScheduleCard(item)}
                    </View>
                  )}
                  contentContainerStyle={{ paddingRight: 32 }}
                />
              ) : (
                <View style={[styles.emptyCard, { marginHorizontal: 16 }]}>
                  <Text style={styles.emptyText}>No upcoming classes today.</Text>
                </View>
              )}

              {/* COMPLETED */}
              <View style={[styles.sectionHeading, { marginTop: 24 }]}>
                <Text style={styles.sectionTitle}>✅ Completed Today</Text>
              </View>
              {schedule.completed.length > 0 ? (
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={schedule.completed}
                  keyExtractor={item => item._id}
                  renderItem={({ item }) => (
                    <View style={{ width: 280, marginLeft: 16 }}>
                      {renderScheduleCard(item)}
                    </View>
                  )}
                  contentContainerStyle={{ paddingRight: 32 }}
                />
              ) : (
                <View style={[styles.emptyCard, { marginHorizontal: 16 }]}>
                  <Text style={styles.emptyText}>No completed classes today.</Text>
                </View>
              )}

              {/* CANCELLED */}
              <View style={[styles.sectionHeading, { marginTop: 24 }]}>
                <Text style={styles.sectionTitle}>❌ Cancelled Today</Text>
              </View>
              {schedule.cancelled.length > 0 ? (
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  data={schedule.cancelled}
                  keyExtractor={item => item._id}
                  renderItem={({ item }) => (
                    <View style={{ width: 280, marginLeft: 16 }}>
                      {renderScheduleCard(item)}
                    </View>
                  )}
                  contentContainerStyle={{ paddingRight: 32 }}
                />
              ) : (
                <View style={[styles.emptyCard, { marginHorizontal: 16 }]}>
                  <Text style={styles.emptyText}>No cancelled classes today.</Text>
                </View>
              )}
            </>
          )}

          {/* ================================================= */}
          {/* FOOTER */}`;

content = content.replace(todayScheduleRegex, newTodaySchedule);

fs.writeFileSync('src/screens/dashboard/DashboardScreen.js', content, 'utf8');
console.log("Refactoring complete");
