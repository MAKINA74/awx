/*************************************************
* Copyright (c) 2016 Ansible, Inc.
*
* All Rights Reserved
*************************************************/

export default ['$log', 'moment', function($log, moment){
    var val = {
        // parses stdout string from api and formats various codes to the
        // correct dom structure
        prettify: function(line, unstyled){

            line = line
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");

            // TODO: remove once Chris's fixes to the [K lines comes in
            if (line.indexOf("[K") > -1) {
                $log.error(line);
            }

            if(!unstyled){
                // add span tags with color styling
                line = line.replace(/u001b/g, '');

                // ansi classes
                line = line.replace(/\[1;im/g, '<span class="JobResultsStdOut-cappedLine">');
                line = line.replace(/\[1;31m/g, '<span class="ansi1 ansi31">');
                line = line.replace(/\[0;31m/g, '<span class="ansi1 ansi31">');
                line = line.replace(/\[0;32m/g, '<span class="ansi32">');
                line = line.replace(/\[0;32m=/g, '<span class="ansi32">');
                line = line.replace(/\[0;32m1/g, '<span class="ansi36">');
                line = line.replace(/\[0;33m/g, '<span class="ansi33">');
                line = line.replace(/\[0;34m/g, '<span class="ansi34">');
                line = line.replace(/\[0;35m/g, '<span class="ansi35">');
                line = line.replace(/\[0;36m/g, '<span class="ansi36">');
                line = line.replace(/(<host.*?>)\s/g, '$1');

                //end span
                line = line.replace(/\[0m/g, '</span>');
            } else {
                // For the host event modal in the standard out tab,
                // the styling isn't necessary
                line = line.replace(/u001b/g, '');

                // ansi classes
                line = line.replace(/\[1;31m/g, '');
                line = line.replace(/\[0;31m/g, '');
                line = line.replace(/\[0;32m/g, '');
                line = line.replace(/\[0;32m=/g, '');
                line = line.replace(/\[0;32m1/g, '');
                line = line.replace(/\[0;33m/g, '');
                line = line.replace(/\[0;34m/g, '');
                line = line.replace(/\[0;35m/g, '');
                line = line.replace(/\[0;36m/g, '');
                line = line.replace(/(<host.*?>)\s/g, '$1');

                //end span
                line = line.replace(/\[0m/g, '');
            }

            return line;
        },
        // adds anchor tags and tooltips to host status lines
        getAnchorTags: function(event){
            if(event.event_name.indexOf("runner_") === -1){
                return `"`;
            }
            else{
                return ` JobResultsStdOut-stdoutColumn--clickable" ui-sref="jobDetail.host-event.stdout({eventId: ${event.id}, taskUuid: '${event.event_data.task_uuid}' })" aw-tool-tip="Event ID: ${event.id} <br>Status: ${event.event_display} <br>Click for details" data-placement="top"`;
            }

        },
        // this adds classes based on event data to the
        // .JobResultsStdOut-aLineOfStdOut element
        getLineClasses: function(event, line, lineNum) {
            var string = "";

            if (lineNum === event.end_line) {
                // used to tell you where to put stuff in the pane
                string += ` next_is_${event.end_line + 1}`;
            }

            if (event.event_name === "playbook_on_play_start") {
                // play header classes
                string += " header_play";
                string += " header_play_" + event.event_data.play_uuid;

                // give the actual header class to the line with the
                // actual header info (think cowsay)
                if (line.indexOf("PLAY") > -1) {
                    string += " actual_header";
                }
            } else if (event.event_name === "playbook_on_task_start") {
                // task header classes
                string += " header_task";
                string += " header_task_" + event.event_data.task_uuid;

                // give the actual header class to the line with the
                // actual header info (think cowsay)
                if (line.indexOf("TASK") > -1 ||
                    line.indexOf("RUNNING HANDLER") > -1) {
                    string += " actual_header";
                }

                // task headers also get classed by their parent play
                // if applicable
                if (event.event_data.play_uuid) {
                    string += " play_" + event.event_data.play_uuid;
                }
            } else if (event.event_name !== "playbook_on_stats"){
                string += " not_skeleton";
                // host status or debug line

                // these get classed by their parent play if applicable
                if (event.event_data.play_uuid) {
                    string += " play_" + event.event_data.play_uuid;
                }
                // as well as their parent task if applicable
                if (event.event_data.task_uuid) {
                    string += " task_" + event.event_data.task_uuid;
                }
            }

            // TODO: adding this line_num_XX class is hacky because the
            // line number is availabe in children of this dom element
            string += " line_num_" + lineNum;

            return string;
        },
        getStartTimeBadge: function(event, line){
            // This will return a div with the badge class
            // for the start time to show at the right hand
            // side of each stdout header line.
            // returns an empty string if not a header line
            var emptySpan = "", time;
            if ((event.event_name === "playbook_on_play_start" ||
                event.event_name === "playbook_on_task_start") &&
                line !== "") {
                    time =  moment(event.created).format('HH:mm:ss');
                    return `<div class="badge JobResults-timeBadge ng-binding">${time}</div>`;
            }
            else if(event.event_name === "playbook_on_stats" && line.indexOf("PLAY") > -1){
                time =  moment(event.created).format('HH:mm:ss');
                return `<div class="badge JobResults-timeBadge ng-binding">${time}</div>`;
            }
            else {
                return emptySpan;
            }

        },
        // used to add expand/collapse icon next to line numbers of headers
        getCollapseIcon: function(event, line) {
            var clickClass,
                expanderizerSpecifier;

            var emptySpan = `
<span class="JobResultsStdOut-lineExpander"></span>`;

            if ((event.event_name === "playbook_on_play_start" ||
                event.event_name === "playbook_on_task_start") &&
                line !== "") {
                    if (event.event_name === "playbook_on_play_start" &&
                        line.indexOf("PLAY") > -1) {
                            // play header specific attrs
                            expanderizerSpecifier = "play";
                            clickClass = "play_" +
                                event.event_data.play_uuid;
                    } else if (line.indexOf("TASK") > -1 ||
                        line.indexOf("RUNNING HANDLER") > -1) {
                            // task header specific attrs
                            expanderizerSpecifier = "task";
                            clickClass = "task_" +
                                event.event_data.task_uuid;
                    } else {
                        // header lines that don't have PLAY, TASK,
                        // or RUNNING HANDLER in them don't get
                        // expand icon.
                        // This provides cowsay support.
                        return emptySpan;
                    }


                var expandDom = `
<span class="JobResultsStdOut-lineExpander">
    <i class="JobResultsStdOut-lineExpanderIcon fa fa-caret-down expanderizer
        expanderizer--${expanderizerSpecifier} expanded"
        ng-click="toggleLine($event, '.${clickClass}')"
        data-uuid="${clickClass}">
    </i>
</span>`;
                return expandDom;
            } else {
                // non-header lines don't get an expander
                return emptySpan;
            }
        },
        getLineArr: function(event) {
            let lineNums = _.range(event.start_line + 1,
                event.end_line + 1);

            // hack around no-carriage return issues
            if (!lineNums.length) {
                lineNums = [event.start_line + 1];
            }

            let lines = event.stdout
                .replace("\t", "        ")
                .split("\r\n");

            if (lineNums.length > lines.length) {
                let padBy = lineNums.length - lines.length;

                for (let i = 0; i <= padBy; i++) {
                    lines.push("[1;imLine capped.[0m");
                }
            }

            // hack around no-carriage return issues
            if (lineNums.length === lines.length) {
                return _.zip(lineNums, lines);
            }

            return _.zip(lineNums, lines).slice(0, -1);
        },
        // public function that provides the parsed stdout line, given a
        // job_event
        parseStdout: function(event){
            // this utilizes the start/end lines and stdout blob
            // to create an array in the format:
            // [
            //     [lineNum, lineText],
            //     [lineNum, lineText],
            // ]
            var lineArr = this.getLineArr(event);

            // this takes each `[lineNum: lineText]` element and calls the
            // relevant helper functions in this service to build the
            // parsed line of standard out
            lineArr = lineArr
                .map(lineArr => {
                    return `
<div class="JobResultsStdOut-aLineOfStdOut${this.getLineClasses(event, lineArr[1], lineArr[0])}">
    <div class="JobResultsStdOut-lineNumberColumn">${this.getCollapseIcon(event, lineArr[1])}${lineArr[0]}</div>
    <div class="JobResultsStdOut-stdoutColumn${this.getAnchorTags(event)}>${this.prettify(lineArr[1])} ${this.getStartTimeBadge(event, lineArr[1])}</div>
</div>`;
                });

            // this joins all the lines for this job_event together and
            // returns to the mungeEvent function
            return lineArr.join("");
        }
    };
    return val;
}];
