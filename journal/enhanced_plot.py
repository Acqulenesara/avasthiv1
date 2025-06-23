# enhanced_plot.py - Fixed Plotting Module
# ============================================================================

import matplotlib.pyplot as plt
import matplotlib.dates as mdates
from datetime import datetime, timedelta
import numpy as np
from collections import Counter
from enhanced_db import get_user_stats, fetch_entries_by_user


def plot_comprehensive_analysis(conn, user_id):
    """Create comprehensive analysis dashboard"""
    stats = get_user_stats(conn, user_id)
    entries = fetch_entries_by_user(conn, user_id)

    if not entries:
        print("No journal entries found for analysis.")
        return

    # Create figure with subplots
    fig, ((ax1, ax2), (ax3, ax4)) = plt.subplots(2, 2, figsize=(15, 12))
    fig.suptitle(f'Journal Analytics Dashboard - Total Entries: {stats["total_entries"]}', fontsize=16)

    # 1. Sentiment Trend Over Time
    dates = [row[0] for row in entries]
    sentiments = [row[1] for row in entries]

    ax1.plot(dates, sentiments, marker='o', linewidth=2, markersize=6, color='blue', alpha=0.7)
    ax1.axhline(y=0, color='gray', linestyle='--', alpha=0.5)
    ax1.axhline(y=stats['avg_sentiment'], color='red', linestyle='-', alpha=0.7,
                label=f'Average: {stats["avg_sentiment"]:.2f}')
    ax1.set_title('Sentiment Trend Over Time')
    ax1.set_ylabel('Sentiment Score')
    ax1.grid(True, alpha=0.3)
    ax1.legend()
    ax1.tick_params(axis='x', rotation=45)

    # 2. Sentiment Distribution (Pie Chart)
    sentiment_labels = ['Positive', 'Neutral', 'Negative']
    sentiment_counts = [stats['positive_entries'], stats['neutral_entries'], stats['negative_entries']]
    colors = ['#4CAF50', '#FFC107', '#F44336']

    # Only plot pie chart if there's data
    if sum(sentiment_counts) > 0:
        ax2.pie(sentiment_counts, labels=sentiment_labels, colors=colors, autopct='%1.1f%%', startangle=90)
        ax2.set_title('Sentiment Distribution')
    else:
        ax2.text(0.5, 0.5, 'No data available', ha='center', va='center', transform=ax2.transAxes)
        ax2.set_title('Sentiment Distribution')

    # 3. Mood Frequency
    if stats['mood_distribution']:
        moods = [mood[0] for mood in stats['mood_distribution'][:8]]  # Top 8 moods
        counts = [mood[1] for mood in stats['mood_distribution'][:8]]

        bars = ax3.bar(moods, counts, color='skyblue', alpha=0.7)
        ax3.set_title('Most Common Moods')
        ax3.set_ylabel('Frequency')
        ax3.tick_params(axis='x', rotation=45)

        # Add value labels on bars
        for bar, count in zip(bars, counts):
            ax3.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.05,
                     str(count), ha='center', va='bottom')
    else:
        ax3.text(0.5, 0.5, 'No mood data available', ha='center', va='center', transform=ax3.transAxes)
        ax3.set_title('Most Common Moods')

    # 4. Writing Streak Analysis
    if len(dates) > 1:
        # Calculate gaps between entries
        date_diffs = [(dates[i] - dates[i - 1]).days for i in range(1, len(dates))]

        # Streak histogram
        ax4.hist(date_diffs, bins=min(20, len(date_diffs)), alpha=0.7, color='orange', edgecolor='black')
        ax4.set_title('Days Between Journal Entries')
        ax4.set_xlabel('Days Gap')
        ax4.set_ylabel('Frequency')
        ax4.axvline(x=np.mean(date_diffs), color='red', linestyle='--',
                    label=f'Average: {np.mean(date_diffs):.1f} days')
        ax4.legend()
    else:
        ax4.text(0.5, 0.5, 'Need more entries\nfor streak analysis', ha='center', va='center', transform=ax4.transAxes)
        ax4.set_title('Days Between Journal Entries')

    plt.tight_layout()
    plt.show()

    # Print detailed statistics
    print_detailed_stats(stats, entries)


def print_detailed_stats(stats, entries):
    """Print detailed text statistics"""
    print("\n" + "=" * 60)
    print("📊 DETAILED JOURNAL ANALYTICS")
    print("=" * 60)

    print(f"📝 Total Entries: {stats['total_entries']}")
    print(f"📈 Average Sentiment: {stats['avg_sentiment']:.3f}")

    # Sentiment breakdown
    total = stats['positive_entries'] + stats['negative_entries'] + stats['neutral_entries']
    if total > 0:
        print(f"😊 Positive Entries: {stats['positive_entries']} ({stats['positive_entries'] / total * 100:.1f}%)")
        print(f"😐 Neutral Entries: {stats['neutral_entries']} ({stats['neutral_entries'] / total * 100:.1f}%)")
        print(f"😔 Negative Entries: {stats['negative_entries']} ({stats['negative_entries'] / total * 100:.1f}%)")

    # Recent activity
    if stats['recent_dates']:
        days_since_last = (datetime.now().date() - stats['recent_dates'][0]).days
        print(f"📅 Last Entry: {days_since_last} days ago")

        # Calculate current streak
        current_streak = calculate_writing_streak(stats['recent_dates'])
        print(f"🔥 Current Writing Streak: {current_streak} days")

    # Top moods
    if stats['mood_distribution']:
        print(f"💭 Most Common Mood: {stats['mood_distribution'][0][0]} ({stats['mood_distribution'][0][1]} times)")

    print("=" * 60)


def calculate_writing_streak(recent_dates):
    """Calculate current writing streak"""
    if not recent_dates:
        return 0

    today = datetime.now().date()
    streak = 0

    for date in recent_dates:
        days_diff = (today - date).days
        if days_diff == streak:
            streak += 1
        else:
            break

    return streak