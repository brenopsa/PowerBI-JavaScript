var reportUrl = 'http://powerbiembedapiv2.azurewebsites.net/api/Reports/SampleReport';
var datasetUrl = 'http://powerbiembedapiv2.azurewebsites.net/api/Reports/SampleCreate';
var dashboardUrl = 'http://powerbiembedapiv2.azurewebsites.net/api/Dashboards/SampleDashboard';

var LastReportSampleUrl = null;
var ReportRefreshTokenTimer = 0;
var DashboardRefreshTokenTimer = 0;

const EntityType = {
    Report : "Report",
    Dashboard : "Dashboard",
};

function FetchUrlIntoSession(url, updateCurrentToken) {
    return fetch(url).then(function (response) {
        if (response.ok) {
            return response.json()
            .then(function (embedConfig) {
                setSession(embedConfig.embedToken.token, embedConfig.embedUrl, embedConfig.id);
                SetSession(SessionKeys.SampleId, embedConfig.id);

                if (updateCurrentToken)
                {
                    var embedContainerId = (embedConfig.type === "report") ? "embedContainer" : "dashboardContainer";
                    var embedContainer = powerbi.embeds.find(function(embedElement) {return (embedElement.element.id == embedContainerId)});
                    if (embedContainer)
                    {
                        embedContainer.setAccessToken(embedConfig.embedToken.token);
                    }
                }

                if (embedConfig.type === "report")
                {
                    LastReportSampleUrl = url;
                    TokenExpirationRefreshListener(embedConfig.minutesToExpiration, EntityType.Report);
                }
                else
                {
                    TokenExpirationRefreshListener(embedConfig.minutesToExpiration, EntityType.Dashboard);
                }
            });
        }
        else {
            return response.json()
            .then(function (error) {
                throw new Error(error);
            });
        }
    });
}

function TokenExpirationRefreshListener(minutesToExpiration, entityType) {
    var updateAfterMilliSeconds = (minutesToExpiration - 2) * 60 * 1000;

    if (entityType == EntityType.Report)
    {
        if (ReportRefreshTokenTimer)
        {
            console.log("step current Report Embed Token update threads.");
            clearTimeout(ReportRefreshTokenTimer);
        }

        console.log("Report Embed Token will be updated in " + updateAfterMilliSeconds + " milliseconds.");
        ReportRefreshTokenTimer = setTimeout(function() {
            if (LastReportSampleUrl)
            {
                FetchUrlIntoSession(LastReportSampleUrl, true /* updateCurrentToken */);
            }
        }, updateAfterMilliSeconds);
    }
    else if (entityType == EntityType.Dashboard)
    {
        if (DashboardRefreshTokenTimer)
        {
            console.log("step current Dashboard Embed Token update threads.");
            clearTimeout(DashboardRefreshTokenTimer);
        }

        console.log("Dashboard Embed Token will be updated in " + updateAfterMilliSeconds + " milliseconds.");
        DashboardRefreshTokenTimer = setTimeout(function() {
            FetchUrlIntoSession(dashboardUrl, true /* updateCurrentToken */);
        }, updateAfterMilliSeconds);
    }
}

function LoadSampleReportIntoSession() {
    SetSession(SessionKeys.EntityType, EntityType.Report);
    return FetchUrlIntoSession(reportUrl, false /* updateCurrentToken */);
}

function LoadSampleDatasetIntoSession() {
    SetSession(SessionKeys.EntityType, EntityType.Report);
    return FetchUrlIntoSession(datasetUrl, false /* updateCurrentToken */);
}

function LoadSampleDashboardIntoSession() {
    SetSession(SessionKeys.EntityType, EntityType.Dashboard);
    return FetchUrlIntoSession(dashboardUrl, false /* updateCurrentToken */);
}

function OpenEmbedStepWithSample(entityType) {
    SetSession(SessionKeys.EntityType, entityType);

    if (entityType == EntityType.Report)
    {
        SetSession(SessionKeys.IsSampleReport, true);
        OpenEmbedStep(EmbedViewMode, EntityType.Report);
    }
    else if (entityType == EntityType.Dashboard)
    {
        SetSession(SessionKeys.IsSampleDashboard, true);
        OpenEmbedStep(EmbedViewMode, EntityType.Dashboard);
    }
}

function OpenEmbedStepCreateWithSample() {
    SetSession(SessionKeys.IsSampleReport, true);
    SetSession(SessionKeys.EntityType, EntityType.Report);

    OpenEmbedStep(EmbedCreateMode, EntityType.Report);
}

function OpenEmbedStepFromUserSettings() {
    SetSession(SessionKeys.IsSampleReport, false);
    SetSession(SessionKeys.EntityType, EntityType.Report);

    OpenEmbedStep(EmbedViewMode, EntityType.Report);
}

function setSession(accessToken, embedUrl, embedId)
{
    SetSession(SessionKeys.AccessToken, accessToken);
    SetSession(SessionKeys.EmbedUrl, embedUrl);
    SetSession(SessionKeys.EmbedId, embedId);
}