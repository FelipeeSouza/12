import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import Footer from "../../components/Footer";
import Toast from "react-native-toast-message";
import toastConfig from "../../services/toastConfig";
import moment from "moment";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { CalendarConfig, Locale } from "../../services/calendarConfig";
import "moment/locale/pt-br";
import IconOcticons from "react-native-vector-icons/Octicons";
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from "@react-navigation/native-stack";

import { APPOINTMENT } from "../../api/apiRoutes";
import api from "../../services/api";
import { getToken } from "../../services/token";

LocaleConfig.locales.pt = CalendarConfig;
LocaleConfig.defaultLocale = Locale;

type RootStackParamList = {
  NewAppointment: undefined;
};

type Props = NativeStackScreenProps<RootStackParamList, 'NewAppointment'>

interface HoursType {
  [key: number]: { a: boolean; b: boolean; c: boolean; d: boolean };
}

export default function AppointmentAgenda() {
  const navigation = useNavigation<Props['navigation']>();
  const [isCalendarVisible, setCalendarVisible] = React.useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedNameDay, setSelectedNameDay] = useState("");
  const [appointerData, setAppointerData] = useState<any>([]);
  const [entry, setEntry] = useState("");
  const [out, setOut] = useState("");
  let dayTextView: Record<string, string> = {};
  let textDate = "";
  const [description, setDescription] = useState("");
  let title = "Hora Extra Apontada";
  let hours: HoursType = {};
  const [isLoading, setIsLoading] = useState(false);

  const handleCalendarVisibility = () => {
    setCalendarVisible(!isCalendarVisible);
  };

  for (let i = 1; i <= 10; i++) {
    dayTextView[`dayTextView${i}`] = "";
  }
    const [dayHours, setDayHours] = useState(() => {
      const hoursArray = [];
      for (let i = 0; i <= 23; i++) {
        const hourObj = {
          id: i,
          hour: i.toString(),
        };
        hoursArray.push(hourObj);
      }
      return hoursArray;
    });

  useEffect(() => {
    setSelectedDate("");
    //setEntry("2023-07-18T18:00:00.000Z");
   // setOut("2023-07-18T19:00:00.000Z");
    updateAgendaData(moment().format("YYYY-MM-DD"));
    setSelectedDate(moment().format("YYYY-MM-DD"));
    setSelectedDay(moment().format("DD"));
    setSelectedNameDay(moment().format("dddd").charAt(0).toUpperCase() + moment().format("dddd").slice(1));
  }, []);

  const updateAgendaData = async (date: string) => {
    console.log("Atualizando dados da agenda para o dia:", date);
    
    const adjustTimeZone = (dateStr: string | null) => {
      if (!dateStr) return "";
      return moment(dateStr).add(3, 'hours').format();
    };
  
    const fetchData = async () => {
      const tokenData = await getToken();
      setIsLoading(true);
  
      if (!tokenData) {
        Toast.show({
          type: "error",
          text1: "Erro",
          text2: "Você precisa estar logado para realizar essa ação",
        });
        return null;
      }
  
      try {
        const response = await api.get(APPOINTMENT + "?start=" + date + "T00%3A00%3A00.000Z&end=" + date + "T23%3A59%3A59.000Z", {
          headers: {
            Authorization: `Bearer ${tokenData.token}`,
          },
        });
  
        console.log("Response data:", response.data);
  
        if (response.status === 201 || response.status === 200) {
          if (Array.isArray(response.data) && response.data.length > 0) {
            setEntry(adjustTimeZone(response.data[0].entry));
            setOut(adjustTimeZone(response.data[0].out));
            setDescription(response.data[0].description);
  
            let appointerData = response.data.map((item: any) => {
              return {
                id: item.id,
                positiveHours: item.positiveHours,
                entry: adjustTimeZone(item.entry),
                out: adjustTimeZone(item.out),
                description: item.description,
              };
            });
            setAppointerData(appointerData);
            console.log("Sucesso ao retornar os dados para a agenda");
          } else {
            setEntry("");
            setOut("");
            console.log("Não há dados para esse dia");
          }
        }
      } catch (error: any) {
        testErrors(error);
      } finally {
        setIsLoading(false);
      }
      return;
    };
    
    fetchData();
  };
  
  

  const testErrors = async (error: any) => {
    console.log(error);
    if (error.message === "Network Error") {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Erro de conexão, tente novamente em alguns instantes",
        visibilityTime: 5000,
      });
      return;
    } else {
      Toast.show({
        type: "error",
        text1: "Erro",
        text2: "Erro ao retornar os dados, tente novamente em alguns instantes",
        visibilityTime: 5000,
      });
      return;
    }
  };

          const onDayPress = (day: any) => {
            setSelectedDay(day.day);
            setSelectedNameDay(moment(day.dateString).format("dddd").charAt(0).toUpperCase() + moment(day.dateString).format("dddd").slice(1));
            setSelectedDate(day.dateString);
            updateAgendaData(day.dateString);
            setCalendarVisible(false);
          };

        for (let i = 0; i <= 23; i++) {
          hours[i] = { a: false, b: false, c: false, d: false };
        }

        function formatTimeWithLeadingZero(time: any) {
          return time < 10 ? "0" + time : time.toString();
        }
        
        function atualizarHoras(entry: string, out: string) {

          console.log("Entry:", entry)
          console.log("Out:", out)

          const entryDate = new Date(entry);
          const outDate = new Date(out);
          const diffMinutes = Math.round((outDate.getTime() - entryDate.getTime()) / (1000 * 60));

          const hourEntry = Number(entryDate.getHours());
          const hourOut = Number(outDate.getHours());

          const minutesEntry = Number(entryDate.getMinutes());
          const minutesOut = Number(outDate.getMinutes());

          const formattedHourEntry = formatTimeWithLeadingZero(hourEntry);
          const formattedMinutesEntry = formatTimeWithLeadingZero(minutesEntry);
          const formattedHourOut = formatTimeWithLeadingZero(hourOut);
          const formattedMinutesOut = formatTimeWithLeadingZero(minutesOut);

          textDate = `${formattedHourEntry}:${formattedMinutesEntry} até ${formattedHourOut}:${formattedMinutesOut}`;

       if((hourOut - hourEntry) > 1 && (minutesEntry != 0) ) { 
        console.log("Caso 6")
        dayTextView.dayTextView3 = title + " - " + textDate;
        dayTextView.dayTextView5 = title + " - " + textDate;
        dayTextView.dayTextView6 = title + " - " + textDate;

        atualizarHoras3(entry, 60 - minutesEntry, hours);

        for(let i = hourEntry + 1; i < hourOut; i++){
          atualizarHoras4(i, hours)
        }

        if(minutesOut != 0){
        atualizarHoras2(out, minutesOut, hours);
        }

       } else if((hourOut - hourEntry) > 1 && (minutesEntry == 0 && minutesOut == 0) ){
        console.log("Caso 5")
        dayTextView.dayTextView8 = title + " - " + textDate;
        let nextHour = new Date(new Date(entry).getFullYear(), new Date(entry).getMonth(), new Date(entry).getDate(), 1, 0, 0);
        let diffMinutes = Math.round((nextHour.getTime() - entryDate.getTime()) / (1000 * 60));

        for(let i = hourEntry + 1; i < hourOut; i++){
          atualizarHoras4(i, hours)
        }

        if(diffMinutes <= 0){
          diffMinutes = 60;
          atualizarHoras2(entry, diffMinutes, hours)
        }
        atualizarHoras2(entry, diffMinutes, hours)
       }
          else if((hourEntry == hourOut && minutesEntry == 0) || ( (hourEntry != hourOut) && minutesEntry == 0 && minutesOut == 0)  ) {
            console.log("Caso 0")
            dayTextView.dayTextView1 = title + " - " + textDate;
            dayTextView.dayTextView2 = title + " - " + textDate;
            dayTextView.dayTextView7 = title + " - " + textDate;
            dayTextView.dayTextView8 = title + " - " + textDate;
            atualizarHoras2(entry, diffMinutes, hours);

          } else if((minutesEntry != 0 && (minutesEntry != 0)) || (hourEntry != hourOut && minutesOut == 0) && (minutesEntry != 0 && minutesOut == 0) ){
            console.log("Caso 2")
            dayTextView.dayTextView10 = title + " - " + textDate;
            dayTextView.dayTextView4 = title + " - " + textDate;
            dayTextView.dayTextView3 = title + " - " + textDate;
            dayTextView.dayTextView5 = title + " - " + textDate;
            dayTextView.dayTextView9 = title + " - " + textDate;
            dayTextView.dayTextView6 = title + " - " + textDate;

            if(hourEntry != hourOut){
              let nextHour = new Date(new Date(entry).getFullYear(), new Date(entry).getMonth(), new Date(entry).getDate(), 1, 0, 0);
              let diffMinutesX = Math.round((outDate.getTime() - nextHour.getTime()) / (1000 * 60));
              let diffMinutesY = Math.round((nextHour.getTime() - entryDate.getTime()) / (1000 * 60));

              if(hourEntry != 0 && hourOut != 0){
              atualizarHoras3(entry, 60 - minutesEntry, hours);

              if(minutesOut == 0){
                return;
              } else {
                atualizarHoras2(out, minutesOut, hours);
                return;
              }
            }
              atualizarHoras3(entry, diffMinutesY, hours);

              if(diffMinutesX != 0 && (hourOut - hourEntry == 1)){
              atualizarHoras2(out, diffMinutesX, hours);
              } else if (diffMinutesX != 0 && (hourOut - hourEntry != 1)) {
                atualizarHoras4(hourOut - 1, hours);
              }

            } else {
              atualizarHoras3(entry, diffMinutes, hours);
            }

          } else if(hourEntry != hourOut && (hourOut - hourEntry) == 1){
            console.log("Caso 1")     
            dayTextView.dayTextView8 = title + " - " + textDate; 
            const dataAtual = new Date(entryDate);
            const proximaHora = new Date(dataAtual);
            proximaHora.setUTCHours(proximaHora.getUTCHours() + 1);
           
            let diffMinutes = Math.round((proximaHora.getTime() - entryDate.getTime()) / (1000 * 60));
            let diffMinutes2 = Math.round((outDate.getTime() - proximaHora.getTime() ) / (1000 * 60));

            atualizarHoras2(entry, diffMinutes, hours);
            atualizarHoras2(out, diffMinutes2, hours);
            
          } else if(hourEntry != hourOut && (hourOut - hourEntry) > 1){
            console.log("Caso 4")
            dayTextView.dayTextView8 = title + " - " + textDate;
            let nextHour = new Date(new Date(entry).getFullYear(), new Date(entry).getMonth(), new Date(entry).getDate(), 1, 0, 0);
            let diffMinutes = Math.round((nextHour.getTime() - entryDate.getTime()) / (1000 * 60));

            for(let i = hourEntry + 1; i < hourOut; i++){
              atualizarHoras4(i, hours);
            }

            if(hourEntry == 0){
              atualizarHoras2(entry, diffMinutes, hours)
              atualizarHoras2(out, minutesOut, hours);
              return;
            } else {
            atualizarHoras4(hourEntry, hours);
            atualizarHoras2(out, minutesOut, hours);
            }
          }
      }

      function atualizarHoras4(x: number, hourObj: any) {
        const hours = x;
          hourObj[hours].a = true;
          hourObj[hours].b = true;
          hourObj[hours].c = true;
          hourObj[hours].d = true;
      }
        
      function atualizarHoras3(entryDate: string, diffMinutes: number, hourObj: any) {
        const entryDate1 = new Date(entryDate);
        const hours = entryDate1.getHours();

        let nextHour = new Date(entryDate1);
        nextHour.setHours(nextHour.getHours() + 1);
        nextHour.setMinutes(0, 0, 0);

        let diffMinutesToTheEnd = Math.round((nextHour.getTime() - entryDate1.getTime()) / (1000 * 60));
        if (diffMinutes === 15) {     

          if(diffMinutesToTheEnd == 45){
            hourObj[hours].b = true;
          } else if(diffMinutesToTheEnd == 30){
            hourObj[hours].c = true;
          } else if(diffMinutesToTheEnd == 15){
            hourObj[hours].d = true;
          }

        } else if (diffMinutes === 30) {
          if(diffMinutesToTheEnd == 45){
            hourObj[hours].b = true;
            hourObj[hours].c = true;
          } else if(diffMinutesToTheEnd == 30){
            hourObj[hours].c = true;
            hourObj[hours].d = true;
          } else if(diffMinutesToTheEnd == 15){
            hourObj[hours].d = true;
          }

        } else if (diffMinutes === 45) {
          if(diffMinutesToTheEnd == 45){
            hourObj[hours].b = true;
            hourObj[hours].c = true;
            hourObj[hours].d = true;
          } else if(diffMinutesToTheEnd == 30){
            hourObj[hours].c = true;
            hourObj[hours].d = true;
          } else if(diffMinutesToTheEnd == 15){
            hourObj[hours].d = true;
          }
        } 
      }

        function atualizarHoras2(entryDate: string, diffMinutes: number, hourObj: any) {
          const entryDate1 = new Date(entryDate);
          const hours = entryDate1.getHours();
          if (hours >= 0 && hours <= 23) {
            hourObj[hours].a = true;
            if (diffMinutes >= 30) {
              hourObj[hours].b = true;
            }
            if (diffMinutes === 45) {
              hourObj[hours].c = true;
            }
            if (diffMinutes === 60) {
              hourObj[hours].c = true;
              hourObj[hours].d = true;
            }
          }
        }

    atualizarHoras(entry, out);

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={styles.container1}>
        <View style={styles.mainTitle}>
          <Text style={styles.titleText}>Meus Apontamentos</Text>
        </View>
  
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => handleCalendarVisibility()}>
          <Icon
            name="calendar"
            size={25}
            color="black"
            style={styles.calendarIcon}/>
        <Text style={styles.input}>
          {selectedDate
            ? moment(selectedDate).format("MMMM") +
            " de " +
            moment(selectedDate).format("YYYY")
            : "Selecione um dia"}
        </Text>
        </TouchableOpacity>

        {isLoading ? (
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: "3%" }}>
          <ActivityIndicator size="small" color="black" style={{ marginRight: 5 }} />
          <Text style={{ fontWeight: "bold", color: "black" }}>Carregando apontamentos...</Text>
        </View>
        )
        : (
          <View>
          </View>
        )
        }
      
        {isCalendarVisible && (
            <View style={{ flex: 1 }}>
              <Calendar
                onDayPress={onDayPress}
                markedDates={{ [selectedDate]: { selected: true } }}
                monthFormat={"MMMM yyyy"}
                theme={{
                  monthTextColor: "black",
                  arrowColor: "black",
                  todayTextColor: "#7A00E6",
                  selectedDayTextColor: "white",
                  selectedDayBackgroundColor: "black",
                  textDayFontSize: 17,
                  textMonthFontSize: 16,
                }}
              />
            </View>
          )}
        
        <ScrollView style={styles.scrollView}>

  
          <View style={{ borderWidth: 0.6, borderColor: "grey" }}>
            {selectedDate && (
              <View
                style={{
                  backgroundColor: "#23004C",
                  paddingBottom: "2%",
                  paddingTop: "2%",
                }}
              >
                <Text style={{ fontSize: 27, marginLeft: "2.5%", color: "white" }}>
                  {selectedDay}
                </Text>
                <Text style={{ fontSize: 17, marginLeft: "2.5%", color: "white" }}>
                  {selectedNameDay}
                </Text>
              </View>
            )}
  
            {selectedDate && (
              <View style={{ width: "100%", marginBottom: "2%" }}>
                {dayHours.map((item, index: any) => (
                  <View key={`extra_${index}`} style={{ flexDirection: "row" }}>
                    <View key={item.id} style={styles.dayContainer}>
                      <Text style={styles.dayText}>{item.hour}</Text>
                    </View>
                    {item.hour === index.toString() ? (
                      <View style={styles.mainView}>
                        {hours[index]?.a && hours[index]?.b === false && hours[index]?.c === false && hours[index]?.d === false ? ( //0h00 até 0h15
                          <View>
                          <View style={{ borderRadius: 10, borderTopLeftRadius: hours[index -1]?.d ? 0 : 10, borderTopRightRadius: hours[index -1]?.d ? 0 : 10, height: hours[index -1]?.d ? 50 : 50, backgroundColor: "#D9DBE8", marginTop: hours[index -1]?.d ? "-3%" : "1%", marginLeft: "1%", marginBottom: "0%", marginRight: "5%" }}>
                          <View style={{flexDirection: "row"}}>
                          <View style={{backgroundColor: "#23004C", width: 5, height: hours[index -1]?.d ? 50 : 50, borderTopLeftRadius: hours[index -1]?.d ? 0 : 10, borderBottomLeftRadius: 10 }}></View>
                            <View>
                                <Text style={styles.textDay}>{dayTextView.dayTextView1}</Text>
                                            {dayTextView.dayTextView1 ? (
                                            <Text style={styles.textDay1}>{description}</Text>
                                            ) : (
                                              <Text></Text>
                                            )
                                            }
                            </View>
                            </View>
                            </View>
                            <View style={styles.fortyFiveView}></View>
                          </View>
                        ) : (
                          hours[index]?.a && hours[index]?.b && hours[index]?.c === false && hours[index]?.d === false ? ( //0h00 até 0h30
                            <View>
                            <View style={{ borderRadius: 10, borderTopLeftRadius: hours[index -1]?.d ? 0 : 10, borderTopRightRadius: hours[index -1]?.d ? 0 : 10, height: hours[index -1]?.d ? 100 : 100, backgroundColor: "#D9DBE8", marginTop: hours[index -1]?.d ? "-3%" : "1%", marginLeft: "1%", marginBottom: "0%", marginRight: "5%" }}>
                            <View style={{flexDirection: "row"}}>
                            <View style={{backgroundColor: "#23004C", width: 5, height: hours[index -1]?.d ? 100 : 100, borderTopLeftRadius: hours[index -1]?.d ? 0 : 10, borderBottomLeftRadius: 10 }}></View>
                            <View>
                                            <Text style={styles.textDay}>{dayTextView.dayTextView2}</Text>

                                            {dayTextView.dayTextView2 ? (
                                            <Text style={styles.textDay1}>{description}</Text>
                                            ) : (
                                              <Text></Text>
                                            )
                                            }
                                        </View>
                                        </View>
                              </View>
                              <View style={styles.fiftyView}></View>
                            </View>
                          ) : (
                            hours[index]?.a === false && hours[index]?.b && hours[index]?.c && hours[index]?.d ? ( //00h15 até 01h00
                              <View>
                                <View style={ styles.twentyView }></View>
                                <View style={{ borderRadius: 10, height: 150, backgroundColor: "#D9DBE8", marginTop: "1%", marginLeft: "1%", marginBottom: hours[1]?.a ? "-0.07%" : "1%", marginRight: "5%" }}>
                                
                                <View style={{flexDirection: "row"}}>

                                <View style={{backgroundColor: "#23004C", width: 5, height: 150, borderTopLeftRadius: 10, borderBottomLeftRadius: 10 }}></View>

                                <View>
                                            <Text style={styles.textDay}>{dayTextView.dayTextView3}</Text>
                                            {dayTextView.dayTextView3 ? (
                                            <Text style={styles.textDay1}>{description}</Text>
                                            ) : (
                                              <Text></Text>
                                            )
                                            }
                                        </View>
                                        </View>
                                </View>
                              </View>
                            ) : (
                              hours[index]?.a === false && hours[index]?.b && hours[index]?.c && hours[index]?.d === false ? ( //0h15 até 0h45
                                <View>
                                  <View style={styles.twentyView}></View>
                                  <View style={{ borderRadius: 10, height: 100, backgroundColor: "#D9DBE8", marginTop: "1%", marginLeft: "1%", marginBottom: hours[1]?.a ? "-0.07%" : "1%", marginRight: "5%" }}>
                                  
                                  <View style={{flexDirection: "row"}}>
                                      <View style={{backgroundColor: "#23004C", width: 5, height: 100, borderTopLeftRadius: 10, borderBottomLeftRadius: 10 }}></View>
                                  <View>
                                            <Text style={styles.textDay}>{dayTextView.dayTextView4}</Text>
                                            {dayTextView.dayTextView4 ? (
                                            <Text style={styles.textDay1}>{description}</Text>
                                            ) : (
                                              <Text></Text>
                                            )
                                            }
                                        </View>
                                        </View>
                                  </View>
                                  <View style={styles.twentyView}></View>
                                </View>
                              ) : (
                                hours[index]?.a === false && hours[index]?.b === false && hours[index]?.c && hours[index]?.d ? ( //0h30 até 1h
                                  <View>
                                    <View style={styles.fiftyView}></View>
                                    
                                    <View style={{ borderRadius: 10, height: 100, backgroundColor: "#D9DBE8", marginTop: "1%", marginLeft: "1%", marginBottom: hours[1]?.a ? "-0.07%" : "1%", marginRight: "5%" }}>
                                    
                                    <View style={{flexDirection: "row"}}>

                                    <View style={{backgroundColor: "#23004C", width: 5, height: 100, borderTopLeftRadius: 10, borderBottomLeftRadius: 10 }}></View>
                                    <View>
                                            <Text style={styles.textDay}>{dayTextView.dayTextView5}</Text>

                                            {dayTextView.dayTextView5 ? (
                                            <Text style={styles.textDay1}>{description}</Text>
                                            ) : (
                                              <Text></Text>
                                            )
                                            }

                                        </View>
                                        </View>
                                    </View>
                                  </View>
                                ) : (
                                  hours[index]?.a === false && hours[index]?.b === false && hours[index]?.c === false && hours[index]?.d ? ( //0h45 até 1h
                                    <View>
                                      <View style={styles.fortyFiveView}></View>
                                      <View style={{ borderRadius: 10, height: 50, backgroundColor: "#D9DBE8", marginTop: "1%", marginLeft: "1%", marginBottom: hours[1]?.a ? "-0.07%" : "1%", marginRight: "5%" }}>
                                      
                                      <View style={{flexDirection: "row"}}>

                                      <View style={{backgroundColor: "#23004C", width: 5, height: 50, borderTopLeftRadius: 10, borderBottomLeftRadius: 10 }}></View>
                                      
                                          <View>
                                            <Text style={styles.textDay}>{dayTextView.dayTextView6}</Text>

                                            {dayTextView.dayTextView6 ? (
                                            <Text style={styles.textDay1}>{description}</Text>
                                            ) : (
                                              <Text></Text>
                                            )
                                            }
                                          </View>
                                        </View>
                                      </View>  
                                    </View>
                                  ) : (
                                    hours[index]?.a && hours[index]?.b && hours[index]?.c && hours[index]?.d === false ? ( //0h00 até 0h45
                                      <View>
                                        <View style={{ borderRadius: 10, borderTopLeftRadius: hours[index -1]?.d ? 0 : 10, borderTopRightRadius: hours[index -1]?.d ? 0 : 10, height: hours[index -1]?.d ? 150 : 150, backgroundColor: "#D9DBE8", marginTop: hours[index -1]?.d ? "-3%" : "1%", marginLeft: "1%", marginBottom: "0%", marginRight: "5%" }}>
                                        
                                        <View style={{flexDirection: "row"}}>

                                        <View style={{backgroundColor: "#23004C", width: 5, height: hours[index -1]?.d ? 150 : 150, borderTopLeftRadius: hours[index -1]?.d ? 0 : 10, borderBottomLeftRadius: 10 }}></View>
                                        
                                        <View>
                                            <Text style={styles.textDay}>{dayTextView.dayTextView7}</Text>

                                            {dayTextView.dayTextView7 ? (
                                            <Text style={styles.textDay1}>{description}</Text>
                                            ) : (
                                              <Text></Text>
                                            )
                                            }

                                        </View></View>
                                        </View>
                                        <View style={styles.twentyView}></View>
                                      </View>
                                    ) : (
                                      hours[index]?.a && hours[index]?.b && hours[index]?.c && hours[index]?.d ? ( //1h
                                      <View style={{ borderRadius: 10, borderTopLeftRadius: hours[index -1]?.d ? 0 : 10, borderTopRightRadius: hours[index -1]?.d ? 0 : 10, height: 200, backgroundColor: "#D9DBE8", marginTop: hours[index -1]?.d ? "-3%" : "1%", marginLeft: "1%", marginBottom: "1%", marginRight: "5%" }}>
                          
                                      {  !(hours[index -1]?.a) ? (
                                        
                                        <View style={{flexDirection: "row"}}>

                                        <View style={{backgroundColor: "#23004C", width: 5, height: 200, borderTopLeftRadius: hours[index -1]?.d ? 0 : 10, borderBottomLeftRadius: 10 }}></View>
                                        
                                        <View>
                                            <Text style={styles.textDay}>{dayTextView.dayTextView8}</Text>

                                            {dayTextView.dayTextView8 ? (
                                            <Text style={styles.textDay1}>{description}</Text>
                                            ) : (
                                              <Text></Text>
                                            )
                                            }

                                        </View></View>
                                          ) : (
                                            <View>
                                              <View style={{backgroundColor: "#23004C", width: 5, height: 200, borderTopLeftRadius: 0, borderBottomLeftRadius: 10 }}></View>
                                            </View>
                                          )
                                          }
                                            
                                        </View>
                                      ) : (
                                        hours[index]?.a === false && hours[index]?.b === false && hours[index]?.c && hours[index]?.d === false ? ( //0h30 - 0h45
                                          <View>
                                            <View style={styles.fiftyView}>
                                            </View>
                                            <View style={{ borderRadius: 10, height: 50, backgroundColor: "#D9DBE8", marginTop: "1%", marginLeft: "1%", marginBottom: hours[1]?.a ? "-0.07%" : "1%", marginRight: "5%" }}>
                                              <View style={{flexDirection: "row"}}>
                                              <View style={{backgroundColor: "#23004C", width: 5, height: 50, borderTopLeftRadius: 10, borderBottomLeftRadius: 10 }}></View>

                                              <View>
                                              <Text style={styles.textDay}>{dayTextView.dayTextView9}</Text>
                                              <Text style={styles.textDay1}>{description}</Text>
                                              </View>
                                            </View>
                                            </View>
                                            <View style={styles.twentyView}></View>
                                          </View>
                                        ) : (
                                          hours[index]?.a === false && hours[index]?.b && hours[index]?.c === false && hours[index]?.d === false ? ( //0h15 até 0h30
                                          <View>
                                            
                                              <View style={styles.twentyView}></View>

                                              <View style={{ borderRadius: 10, height: 50, backgroundColor: "#D9DBE8", marginTop: "1%", marginLeft: "1%", marginBottom: hours[1]?.a ? "-0.07%" : "1%", marginRight: "5%" }}>
                                              <View style={{flexDirection: "row"}}>
                                    
                                              <View style={{backgroundColor: "#23004C", width: 5, height: 50, borderTopLeftRadius: 10, borderBottomLeftRadius: 10 }}></View>
  
                                              <View>
                                              <Text style={styles.textDay}>{dayTextView.dayTextView10}</Text>
                                              <Text style={styles.textDay1}>{description}</Text>
                                              </View>
                                              </View>
                                              </View>
                                              <View style={styles.fiftyView}></View>
                                              </View>
                                          ) : (
                                            <View></View>
                                          )
                                        )
                                      )
                                    )
                                  )
                                )
                              )
                            )
                          )
                        )}
                      </View>
                    ) : (  <View></View> )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>

        <Toast config={toastConfig} />

        <View style={styles.buttonContainer}>
          <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("NewAppointment")}>
            <View style={{flexDirection: "row", justifyContent: "center", alignContent: "center", alignItems: "center"}}>
              <IconOcticons name="plus" size={18} color="white" style={{}}/>
              <Text style={styles.buttonText}>Novo Apontamento</Text>
            </View>
          </TouchableOpacity>
        </View>

      </View>
      <Toast config={toastConfig} />
      <Footer />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    position: 'absolute',
    height: 40,
    width: '60%',
    bottom: 5,
    right: 25,
  },
  button: {
    backgroundColor: '#23004C',
    borderRadius: 5,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  buttonText: {
    marginLeft: "5%",
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
  twentyView:{
    borderRadius: 10, height: 50, marginLeft: "1%", marginRight: "1%"
  },
  fiftyView:{
    borderRadius: 10, height: 100, marginLeft: "1%", marginRight: "1%"
  },
  fortyFiveView: {
     borderRadius: 10, height: 150, marginLeft: "1%", marginRight: "1%" 
  },
  textDay : {
    marginLeft: "5%", marginTop: "2%", fontSize: 16, fontWeight: "bold", color: "black"
  },
  textDay1 : {
    marginLeft: "5%", marginTop: "1%", fontSize: 15.5, color: "black"
  },
  mainView: {
    maxHeight: "100%", width: "90%", marginLeft: "1%", borderWidth: 0.5, borderColor: 'grey', marginRight: "10%"
  },
  scrollView: {
    flex: 1,
  },
  calendarIcon: {
    marginLeft: "3%",
    marginTop: 2,
  },
  dateInput: {
    height: 45,
    backgroundColor: "#E7E9ED",
    borderRadius: 10,
    marginBottom: "3%",
    textAlign: "center",
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  input: {
    flex: 1,
    marginLeft: "3%",
    textAlignVertical: "center",
    textAlign: "left",
    fontSize: 16,
    alignItems: "center",
    color: "black"
  },
  dayContainer: {
    width: "9%",
    flexDirection: "column",
    alignItems: "center",
    borderColor: "black",
    height: 70,
    paddingTop: "1%",
    color: "black"
  },
  dayText: {
    fontWeight: "bold",
    fontSize: 17,
    color: "black"
  },
  mainTitle: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: "4%",
    textAlign: "center",
    color: "black",
  },
  titleText: {
    fontSize: 19,
    fontWeight: "bold",
    marginTop: "1%",
    color: "black"
  },
  container1: {
    flex: 17,
    backgroundColor: "#FCFCFC",
    paddingStart: "4%",
    paddingEnd: "4%",
    paddingTop: "2%",
  },
  mainContainer: {
    flex: 1,
    backgroundColor: "#FCFCFC7",
  },
});
