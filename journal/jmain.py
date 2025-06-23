# main.py - Fixed Personal Journal Application
from auth import create_user, login_user
from enhanced_db import get_connection, get_user_stats, fetch_entries_by_user
from journal import submit_entry
from enhanced_plot import plot_comprehensive_analysis


def display_menu():
    print("\n" + "=" * 50)
    print("📔 PERSONAL JOURNAL APPLICATION")
    print("=" * 50)
    print("1. Login")
    print("2. Create New Account")
    print("3. Exit")
    print("-" * 50)


def user_menu(user_info):
    while True:
        print(f"\n📔 Welcome back, {user_info['username']}!")
        print("=" * 40)
        print("1. Write New Journal Entry")
        print("2. View Analytics Dashboard")
        print("3. View Recent Entries")
        print("4. Logout")
        print("-" * 40)

        choice = input("Choose an option (1-4): ").strip()

        if choice == '1':
            write_journal_entry(user_info['id'])
        elif choice == '2':
            view_analytics(user_info['id'])
        elif choice == '3':
            view_recent_entries(user_info['id'])
        elif choice == '4':
            print("👋 Goodbye! Keep journaling!")
            break
        else:
            print("❌ Invalid choice. Please try again.")


def write_journal_entry(user_id):
    print("\n✍️  NEW JOURNAL ENTRY")
    print("-" * 30)

    mood = input("How are you feeling today? ")
    print("\nWrite your journal entry (press Enter twice when done):")

    lines = []
    while True:
        line = input()
        if line == "":
            if lines and lines[-1] == "":
                break
            lines.append(line)
        else:
            lines.append(line)

    entry_text = "\n".join(lines[:-1])  # Remove last empty line

    if entry_text.strip():
        try:
            conn = get_connection()
            sentiment = submit_entry(conn, user_id, mood, entry_text)
            conn.close()

            print(f"\n✅ Entry saved! Sentiment score: {sentiment:.2f}")

            if sentiment > 0.1:
                print("😊 Your entry has a positive sentiment!")
            elif sentiment < -0.1:
                print("😔 Your entry has a negative sentiment.")
            else:
                print("😐 Your entry has a neutral sentiment.")
        except Exception as e:
            print(f"❌ Error saving entry: {e}")
    else:
        print("❌ Entry cannot be empty!")


def view_analytics(user_id):
    print("\n📊 Loading your analytics dashboard...")
    try:
        conn = get_connection()
        plot_comprehensive_analysis(conn, user_id)
        conn.close()
    except Exception as e:
        print(f"❌ Error loading analytics: {e}")


def view_recent_entries(user_id):
    try:
        conn = get_connection()
        entries = fetch_entries_by_user(conn, user_id, limit=5)
        conn.close()

        if entries:
            print("\n📖 YOUR RECENT ENTRIES")
            print("=" * 50)
            for i, entry in enumerate(entries, 1):
                date, sentiment, mood, text = entry
                print(f"\n{i}. {date} | Mood: {mood} | Sentiment: {sentiment:.2f}")
                print("-" * 30)
                # Show first 100 characters of entry
                preview = text[:100] + "..." if len(text) > 100 else text
                print(preview)
        else:
            print("\n📝 No entries found. Start writing your first entry!")
    except Exception as e:
        print(f"❌ Error fetching entries: {e}")


def main():
    print("🚀 Initializing Personal Journal Application...")

    while True:
        display_menu()
        choice = input("Choose an option (1-3): ").strip()

        if choice == '1':
            # Login
            username = input("Username: ")
            password = input("Password: ")

            success, result = login_user(username, password)
            if success:
                user_menu(result)
            else:
                print(f"❌ {result}")

        elif choice == '2':
            # Create account
            print("\n📝 CREATE NEW ACCOUNT")
            print("-" * 25)
            username = input("Choose a username: ")
            email = input("Enter your email: ")
            password = input("Choose a password: ")

            success, result = create_user(username, email, password)
            if success:
                print(f"✅ Account created successfully! User ID: {result}")
            else:
                print(f"❌ {result}")

        elif choice == '3':
            print("👋 Thank you for using Personal Journal App!")
            break
        else:
            print("❌ Invalid choice. Please try again.")


if __name__ == "__main__":
    main()