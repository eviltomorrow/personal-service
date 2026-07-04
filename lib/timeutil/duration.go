package timeutil

import (
	"bytes"
	"errors"
	"fmt"
	"time"

	jsoniter "github.com/json-iterator/go"
)

type Duration time.Duration

func (d Duration) MarshalJSON() ([]byte, error) {
	return jsoniter.ConfigCompatibleWithStandardLibrary.Marshal(time.Duration(d).String())
}

func (d *Duration) UnmarshalJSON(b []byte) error {
	var v interface{}
	if err := jsoniter.ConfigCompatibleWithStandardLibrary.Unmarshal(b, &v); err != nil {
		return err
	}
	switch value := v.(type) {
	case float64:
		*d = Duration(time.Duration(value))
		return nil
	case string:
		tmp, err := time.ParseDuration(value)
		if err != nil {
			return err
		}
		*d = Duration(tmp)
		return nil
	default:
		return errors.New("invalid duration")
	}
}

func FormatDuration(d time.Duration) string {
	var (
		day, hour, minute, second int
	)

	switch {
	case d.Hours() > 23.0:
		var h = int(d.Hours())
		day = h / 24
		hour = h % 24
		minute = int(d.Minutes()) - (day*24+hour)*60
		second = int(d.Seconds()) - ((day*24+hour)*60+minute)*60
	case d.Minutes() > 59.0:
		var m = int(d.Minutes())
		hour = m / 60
		minute = m % 60
		second = int(d.Seconds()) - (hour*60+minute)*60
	case d.Seconds() > 59:
		var s = int(d.Seconds())
		minute = s / 60
		second = s % 60
	default:
		second = int(d.Seconds())
	}

	var buf bytes.Buffer
	if day > 0 {
		buf.WriteString(fmt.Sprintf("%d天", day))
	}
	if hour > 0 {
		buf.WriteString(fmt.Sprintf("%d小时", hour))
	}
	if minute > 0 {
		buf.WriteString(fmt.Sprintf("%d分钟", minute))
	}
	if second > 0 {
		buf.WriteString(fmt.Sprintf("%d秒", second))
	}

	if buf.Len() == 0 {
		return "0秒"
	}
	return buf.String()
}
